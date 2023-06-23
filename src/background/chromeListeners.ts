// src/background/chromeListeners.ts
/* eslint-disable import/prefer-default-export */
import { Store, WindowStore } from '../types/Store.types';
import { Messages } from '../types/message.types';
import {
  executeContentScriptOnAllTabs,
  handleRemoveAllHighlightMatches,
  handleSwitchTab,
  handleUpdateTabStatesObj,
} from './backgroundUtils';
import { getActiveTabId } from './helpers/chromeAPI';
import { clearLocalStorage } from './storage';
import {
  handleUpdateLayoverPosition,
  resetPartialStore,
  sendStoreToContentScripts,
  updateStore,
  updateTotalTabsCount,
} from './store';

function getActiveWindowStore(store: Store): WindowStore | undefined {
  const { lastFocusedWindowId } = store;
  if (lastFocusedWindowId !== undefined) {
    return store.windowStores[lastFocusedWindowId];
  }
  return undefined;
}

export function startListeners(store: Store) {
  chrome.runtime.onInstalled.addListener(async () => {
    clearLocalStorage();
  });

  chrome.runtime.onMessage.addListener(
    async (message: Messages, sender, sendResponse) => {
      if (!store) {
        console.error('Store is not yet initialized');
        return undefined;
      }

      console.log('Received message:', message, ' \n Store: ', store);

      const { type, payload } = message;
      const activeWindowStore = getActiveWindowStore(store);

      if (!activeWindowStore) {
        console.error('No active window store available');
        return undefined;
      }

      switch (type) {
        case 'remove-all-highlight-matches':
          await handleRemoveAllHighlightMatches(sendResponse);
          sendStoreToContentScripts(activeWindowStore);
          return true;
        case 'get-all-matches': {
          const { searchValue } = payload;

          resetPartialStore(activeWindowStore);

          updateStore(activeWindowStore, {
            searchValue,
            lastSearchValue: searchValue,
          });

          if (searchValue === '') {
            sendStoreToContentScripts(activeWindowStore);
            return undefined;
          }

          await executeContentScriptOnAllTabs(activeWindowStore);

          sendStoreToContentScripts(activeWindowStore);

          return true;
        }
        case 'update-tab-states-obj':
          await handleUpdateTabStatesObj(
            activeWindowStore,
            payload,
            sendResponse
          );
          return true;

        case 'switch-tab': {
          await handleSwitchTab(
            activeWindowStore,
            payload.serializedState,
            payload.direction
          );
          // updateTabStore(activeWindowStore, payload.serializedState);
          // await switchToTargetTab(
          //   activeWindowStore,
          //   payload.serializedState,
          //   payload.direction
          // );
          // await sendStoreToContentScripts(activeWindowStore);
          // await updateActiveTabState(activeWindowStore, payload.direction);

          return true;
        }

        case 'remove-styles-all-tabs': // FIXME: Maybe rename to 'CLOSE_SEARCH_OVERLAY' - GETS CALLED WHEN CLOSING OVERLAY VIA `Escape` KEY
          updateStore(activeWindowStore, {
            showLayover: false,
            showMatches: false,
          });
          sendStoreToContentScripts(activeWindowStore);

          return true;

        case 'update-layover-position': // FIXME: MAYBE CONSOLIDATE INTO update-tab-states-obj?
          await handleUpdateLayoverPosition(
            activeWindowStore,
            payload.newPosition
          );
          break;
        default:
          break;
      }
      return true;
    }
  );

  chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      return;
    }

    const activeTabId = await getActiveTabId();
    store.lastFocusedWindowId = windowId;

    const activeWindowStore = getActiveWindowStore(store);
    if (!activeWindowStore) {
      console.error('No active window store available');
      return;
    }

    activeWindowStore.activeTabId = activeTabId;

    chrome.windows.get(windowId, (focusedWindow) => {
      if (focusedWindow.type === 'normal') {
        updateTotalTabsCount(activeWindowStore);
        activeWindowStore.updatedTabsCount = 0;

        sendStoreToContentScripts(activeWindowStore);
      }
    });
  });

  chrome.tabs.onCreated.addListener(() => {
    const activeWindowStore = getActiveWindowStore(store);
    if (!activeWindowStore) {
      console.error('No active window store available');
      return;
    }

    updateTotalTabsCount(activeWindowStore);

    sendStoreToContentScripts(activeWindowStore);
  });

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const activeWindowStore = getActiveWindowStore(store);
    if (!activeWindowStore) {
      console.error('No active window store available');
      return;
    }

    updateStore(activeWindowStore, { activeTabId: tabId });

    // TODO: if showMatches then search the new tab and update everything? Otherwise, if you open a new tab, go back to the previously opened tab and search the same value again, it doesn't know to search the new tab because it uses nextMatch(). There are other solutions if you change your mind on this one.

    if (activeWindowStore.showLayover) {
      sendStoreToContentScripts(activeWindowStore);
    }
  });

  chrome.tabs.onUpdated.addListener(async () => {
    const activeWindowStore = getActiveWindowStore(store);
    if (!activeWindowStore) {
      console.error('No active window store available');
      return;
    }

    if (!activeWindowStore.showMatches) {
      return;
    }

    sendStoreToContentScripts(activeWindowStore);
  });

  chrome.tabs.onRemoved.addListener(() => {
    const activeWindowStore = getActiveWindowStore(store);
    if (!activeWindowStore) {
      console.error('No active window store available');
      return;
    }

    updateTotalTabsCount(activeWindowStore);

    sendStoreToContentScripts(activeWindowStore);
  });

  chrome.action.onClicked.addListener(() => {
    const activeWindowStore = getActiveWindowStore(store);
    const addStyles = !activeWindowStore.showLayover;

    updateStore(activeWindowStore, {
      showLayover: addStyles,
      showMatches: addStyles,
    });

    sendStoreToContentScripts(activeWindowStore);
  });

  chrome.commands.onCommand.addListener(async (command) => {
    const activeWindowStore = getActiveWindowStore(store);
    if (!activeWindowStore) {
      console.error('No active window store available');
      return;
    }

    if (command === 'toggle_search_layover') {
      const addStyles = !activeWindowStore.showLayover;

      updateStore(activeWindowStore, {
        showLayover: addStyles,
        showMatches: addStyles,
      });

      sendStoreToContentScripts(activeWindowStore);
    }
  });
}
