// src/background/store.ts

import { LayoverPosition } from '../components/Layover';
import { SerializedTabState, TabId, ValidTabId } from '../types/tab.types';
import { queryWindowTabs } from '../utils/backgroundUtils';

export interface WindowStore extends SharedStore {
  updatedTabsCount: number;
  totalTabs: number | undefined;
  tabStores: Record<ValidTabId, SimplifiedTabState>;
}

export interface SimplifiedTabState {
  tabId: ValidTabId;
  serializedTabState: SerializedTabState;
}

export interface TabStore extends SharedStore {
  tabId: ValidTabId;
  serializedTabState: SerializedTabState;
}

export interface Store {
  lastFocusedWindowId: chrome.windows.Window['id'] | undefined;
  windowStores: Record<chrome.windows.Window['id'], WindowStore>;
}

// Store Interface
export interface SharedStore {
  totalMatchesCount: number;
  layoverPosition: LayoverPosition;
  showLayover: boolean;
  showMatches: boolean;
  activeTabId: TabId;
  searchValue: string;

  // GLOBAL: yes - will need to review after logic changes to immediate searching
  lastSearchValue: string;
}

export async function getAllOpenWindows(): Promise<chrome.windows.Window[]> {
  return new Promise((resolve, reject) => {
    chrome.windows.getAll({ populate: true }, (windows) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(windows);
      }
    });
  });
}

export async function initStore(): Promise<Store> {
  const windows = await getAllOpenWindows();

  const windowStores: Record<chrome.windows.Window['id'], WindowStore> = {};
  let lastFocusedWindowId: chrome.windows.Window['id'] | undefined;

  for (const window of windows) {
    windowStores[window.id] = initWindowStore(window.id);
    lastFocusedWindowId = window.id; //TODO: review
  }

  return {
    lastFocusedWindowId,
    windowStores,
  };
}

export function initWindowStore(
  windowId: chrome.windows.Window['id']
): WindowStore {
  const windowStore: WindowStore = {
    // SharedStore properties:
    totalMatchesCount: 0,
    layoverPosition: { x: 0, y: 0 },
    showLayover: false,
    showMatches: false,
    activeTabId: undefined,
    searchValue: '',
    lastSearchValue: '',

    // WindowStore specific properties:
    updatedTabsCount: 0,
    totalTabs: undefined,
    tabStores: {},
  };

  return windowStore;
}

// export function createTabStore(store: Store, tabId: ValidTabId): TabStore {
export function createTabStore(
  windowStore: WindowStore,
  tabId: ValidTabId
): TabStore {
  let serializedTabState = windowStore.tabStores[tabId]?.serializedTabState;

  if (serializedTabState === undefined) {
    serializedTabState = {
      tabId: tabId,
      currentIndex: 0,
      matchesCount: 0,
      serializedMatches: '',
      globalMatchIdxStart: -1,
    };
  }

  return {
    tabId,
    serializedTabState,

    // SHARED STORE:
    totalMatchesCount: windowStore.totalMatchesCount,
    layoverPosition: windowStore.layoverPosition,
    showLayover: windowStore.showLayover,
    showMatches: windowStore.showMatches,
    searchValue: windowStore.searchValue,
    lastSearchValue: windowStore.lastSearchValue,
    activeTabId: windowStore.activeTabId,
  };
}

export function updateStore(
  windowStore: WindowStore,
  updates: Partial<WindowStore>
): void {
  Object.assign(windowStore, updates);

  if (updates.tabStores) {
    for (const tabId in updates.tabStores) {
      if (updates.tabStores.hasOwnProperty(tabId)) {
        if (!windowStore.tabStores[tabId]) {
          windowStore.tabStores[tabId] = updates.tabStores[tabId];
        } else {
          Object.assign(windowStore.tabStores[tabId], updates.tabStores[tabId]);
        }
      }
    }
  }
}

// FIXME: Unused Function
// export function resetStore(store: Store): void {
//   const initialState = initStore();
//   updateStore(store, initialState);
// }

export function resetPartialStore(windowStore: WindowStore): void {
  const partialInitialState = {
    totalMatchesCount: 0,
    searchValue: '',
    lastSearchValue: '',
    tabStores: {},
  };
  updateStore(windowStore, partialInitialState);
}

export async function sendStoreToContentScripts(
  windowStore: WindowStore,
  tabIds: ValidTabId[] = []
): Promise<any> {
  // const tabs = await queryCurrentWindowTabs();
  const currentWindowTabs = await queryWindowTabs();

  if (tabIds.length === 0) {
    tabIds = currentWindowTabs
      .map((tab) => tab.id)
      .filter((id): id is ValidTabId => id !== undefined);
  }

  const promises = tabIds.map((tabId) => {
    const tabStore = createTabStore(windowStore, tabId);
    const msg = {
      async: false,
      from: 'background:store',
      type: 'store-updated',
      payload: {
        tabId,
        tabStore,
      },
    };

    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  });

  return Promise.all(promises);
}
