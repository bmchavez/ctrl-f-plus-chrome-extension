// src/utils/backgroundUtils.ts

// import { store } from '../background/background';
import { Store, WindowStore, updateStore } from '../background/store';
import { LayoverPosition } from '../components/Layover';
import {
  HighlightMsg,
  RemoveAllHighlightMatchesMsg,
  UpdateHighlightsMsg,
} from '../types/message.types';
import { SerializedTabState, ValidTabId } from '../types/tab.types';
import { getAllStoredTabs, setStoredTabs } from '../utils/storage';
import {
  createHighlightMsg,
  createUpdateHighlightsMsg,
} from './messageUtils/createMessages';
import { sendMessageToTab } from './messageUtils/sendMessageToContentScripts';

/**
 *  Utility/Helper Functions:
 */
export async function queryCurrentWindowTabs(
  activeTab: boolean | undefined = undefined
): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: activeTab, currentWindow: true }, resolve);
  });
}

export async function queryWindowTabs(
  windowId?: chrome.windows.Window['id'],
  activeTab: boolean | undefined = undefined
): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve) => {
    chrome.tabs.query({ windowId, active: activeTab }, resolve);
  });
}

export function getActiveTabId(): Promise<number | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length) {
        resolve(tabs[0].id);
      } else {
        resolve(undefined);
      }
    });
  });
}

export async function getOrderedTabs(
  windowStore: WindowStore,
  includeActiveTab: boolean = true
): Promise<chrome.tabs.Tab[]> {
  const tabs = await queryCurrentWindowTabs();
  const activeTabIndex = tabs.findIndex((tab) => tab.active);
  const startSliceIdx = includeActiveTab ? activeTabIndex : activeTabIndex + 1;

  const orderedTabs = [
    ...tabs.slice(startSliceIdx),
    ...tabs.slice(0, activeTabIndex),
  ];

  return orderedTabs;
}

export async function updateMatchesCount(windowStore: WindowStore) {
  const storedTabs = await getAllStoredTabs();

  let totalMatchesCount = 0;
  for (const tabId in storedTabs) {
    if (storedTabs.hasOwnProperty(tabId)) {
      totalMatchesCount += storedTabs[tabId]?.matchesCount ?? 0;
    }
  }

  updateStore(windowStore, {
    totalMatchesCount,
  });
}

// 'Match X/Y (Total: Z)';
export async function updateTotalTabsCount(windowStore: WindowStore) {
  const tabs = await queryCurrentWindowTabs();
  windowStore.totalTabs = tabs.length;
}

async function executeContentScriptOnTab(
  tab: chrome.tabs.Tab,
  windowStore: WindowStore,
  foundFirstMatch: boolean
): Promise<{
  hasMatch: boolean;
  state: any;
}> {
  try {
    const tabId: ValidTabId = tab.id as number;

    const msg = createHighlightMsg(
      windowStore.searchValue,
      tabId,
      foundFirstMatch
    );
    const response = await sendMessageToTab<HighlightMsg>(tabId, msg);

    const { currentIndex, matchesCount, serializedMatches } =
      response.serializedState;

    await setStoredTabs(response.serializedState);

    const globalMatchIdxStart = windowStore.totalMatchesCount;

    updateStore(windowStore, {
      totalMatchesCount: windowStore.totalMatchesCount + matchesCount,
    });

    updateStore(windowStore, {
      tabStores: {
        ...windowStore.tabStores,
        [tabId]: {
          tabId,
          serializedTabState: {
            tabId,
            currentIndex,
            matchesCount,
            serializedMatches,
            globalMatchIdxStart,
          },
        },
      },
    });

    return response;
  } catch (error) {
    return { hasMatch: false, state: null };
  }
}

export async function executeContentScriptOnAllTabs(windowStore: WindowStore) {
  const orderedTabs = await getOrderedTabs(windowStore);
  let foundFirstMatch = false;
  let firstMatchTabIndex = orderedTabs.length; // default to length, as if no match found

  // Process tabs one by one until the first match
  for (let i = 0; i < orderedTabs.length; i++) {
    const tab = orderedTabs[i];

    if (tab.id) {
      const tabId: ValidTabId = tab.id as number;
      const { hasMatch, state } = await executeContentScriptOnTab(
        tab,
        windowStore,
        foundFirstMatch
      );

      if (hasMatch && !foundFirstMatch) {
        foundFirstMatch = true;
        firstMatchTabIndex = i;

        const activeTab = orderedTabs[0];
        if (activeTab.id !== tabId) {
          chrome.tabs.update(tabId, { active: true });
        }

        break;
      }
    }
  }

  // Process the remaining tabs asynchronously
  const remainingTabs = orderedTabs.slice(firstMatchTabIndex + 1);
  const tabPromises = remainingTabs.map((tab) => {
    if (tab.id) {
      return executeContentScriptOnTab(tab, windowStore, foundFirstMatch);
    }
  });

  await Promise.allSettled(tabPromises);
}

export async function switchTab(
  windowStore: WindowStore,
  serializedState: SerializedTabState
): Promise<void> {
  if (serializedState.tabId === undefined) {
    console.warn('switchTab: Tab ID is undefined:', serializedState);
    return;
  }

  const {
    tabId,
    currentIndex,
    matchesCount,
    serializedMatches,
    globalMatchIdxStart,
  } = serializedState;

  updateStore(windowStore, {
    tabStores: {
      ...windowStore.tabStores,
      [tabId]: {
        tabId,
        serializedTabState: {
          tabId,
          currentIndex,
          matchesCount,
          serializedMatches,
          globalMatchIdxStart,
        },
      },
    },
  });

  const storedTabs = await getAllStoredTabs();
  const matchesObject = storedTabs;
  const tabIds = Object.keys(matchesObject).map((key) => parseInt(key, 10));
  const currentTabIndex = tabIds.findIndex(
    (tabId) => tabId === serializedState.tabId
  );

  const nextTabIndex = (currentTabIndex + 1) % tabIds.length;
  const nextTabId = tabIds[nextTabIndex];

  chrome.tabs.update(nextTabId, { active: true }, async (tab) => {
    if (tab === undefined || tab.id === undefined) return;

    serializedState.tabId = tab.id;

    const msg = createUpdateHighlightsMsg(tab.id);

    await sendMessageToTab<UpdateHighlightsMsg>(tab.id, msg);
  });
}

export async function handleRemoveAllHighlightMatches(sendResponse: Function) {
  const tabs = await queryCurrentWindowTabs();

  const tabPromises = tabs.map((tab) => {
    if (tab.id) {
      const msg: RemoveAllHighlightMatchesMsg = {
        async: false,
        from: 'background:backgroundUtils',
        type: 'remove-all-highlight-matches',
        payload: {
          tabId: tab.id,
        },
      };
      return sendMessageToTab<RemoveAllHighlightMatchesMsg>(tab.id, msg);
    } else {
      return Promise.resolve(null);
    }
  });

  const responses = await Promise.all(tabPromises);
  sendResponse(responses);

  return true;
}

// FIXME: REFACTOR
export async function handleUpdateTabStatesObj(
  windowStore: WindowStore,
  payload: any,
  sendResponse: Function
) {
  const {
    serializedState: {
      currentIndex,
      globalMatchIdxStart,
      matchesCount,
      serializedMatches,
      tabId,
    },
  } = payload;
  await setStoredTabs(payload.serializedState);

  windowStore.updatedTabsCount++;

  if (windowStore.updatedTabsCount === windowStore.totalTabs) {
    updateMatchesCount(windowStore);
    windowStore.updatedTabsCount = 0;
  }

  updateStore(windowStore, {
    tabStores: {
      ...windowStore.tabStores,
      [payload.serializedState.tabId]: {
        ...windowStore.tabStores[payload.serializedState.tabId],
        tabId,
        serializedTabState: {
          tabId,
          currentIndex,
          matchesCount,
          serializedMatches,
          globalMatchIdxStart,
        },
      },
    },
  });

  sendResponse({ status: 'success' });
}

export async function handleUpdateLayoverPosition(
  windowStore: WindowStore,
  newPosition: LayoverPosition
) {
  // setStoredLayoverPosition(newPosition);

  updateStore(windowStore, {
    layoverPosition: newPosition,
  });
}
