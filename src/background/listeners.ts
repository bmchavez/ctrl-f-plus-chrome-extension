// src/background/chromeListeners.ts

import { Messages } from '../types/message.types';

import {
  handleGetAllMatches,
  handleRemoveAllHighlightMatches,
  handleSwitchTab,
  handleUpdateTabStates,
  // } from './backgroundUtils';
} from './messageHandlers';
import { getActiveTabId } from '../utils/background/chromeApiUtils';
import { clearLocalStorage } from '../utils/background/storage';
import store from './store/databaseStore';

export default function startListeners() {
  chrome.runtime.onInstalled.addListener(async () => {
    clearLocalStorage();
  });

  chrome.runtime.onMessage.addListener(
    async (message: Messages, sender, sendResponse) => {
      console.log('Received message:', message, ' \n Store: ', store);

      const { type, payload } = message;
      const { activeWindowStore } = store;

      switch (type) {
        case 'remove-all-highlight-matches':
          await handleRemoveAllHighlightMatches(sendResponse);
          await activeWindowStore.sendToContentScripts();
          break;
        case 'get-all-matches':
          // return handleGetAllMatches(payload.searchValue);
          activeWindowStore.resetPartialStore();
          activeWindowStore.update({
            searchValue: payload.searchValue,
            lastSearchValue: payload.searchValue,
          });

          if (payload.searchValue === '') {
            activeWindowStore.sendToContentScripts();
            return undefined;
          }
          await handleGetAllMatches();
          activeWindowStore.sendToContentScripts();
          return true;
        case 'update-tab-states-obj':
          await handleUpdateTabStates(payload, sendResponse);
          break;
        case 'switch-tab':
          await handleSwitchTab(payload.serializedState, payload.direction);
          break;
        case 'remove-styles-all-tabs': // FIXME: Maybe rename to 'CLOSE_SEARCH_OVERLAY' - GETS CALLED WHEN CLOSING OVERLAY VIA `Escape` KEY
          activeWindowStore.toggleShowFields(false);
          activeWindowStore.sendToContentScripts();
          break;
        case 'update-layover-position': // FIXME: MAYBE CONSOLIDATE INTO update-tab-states-obj?
          activeWindowStore.updateLayoverPosition(payload.newPosition);
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

    store.setLastFocusedWindowId(windowId);

    const { activeWindowStore } = store;
    const activeTabId = await getActiveTabId();
    activeWindowStore.setActiveTabId(activeTabId);

    activeWindowStore.sendToContentScripts();

    chrome.windows.get(windowId, (focusedWindow) => {
      if (focusedWindow.type === 'normal') {
        activeWindowStore.setTotalTabsCount();
        activeWindowStore.setUpdatedTabsCount(0);
      }
    });
  });

  chrome.tabs.onCreated.addListener(() => {
    const { activeWindowStore } = store;
    activeWindowStore.setTotalTabsCount();

    activeWindowStore.sendToContentScripts();
  });

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const { activeWindowStore } = store;
    activeWindowStore.setActiveTabId(tabId);

    if (activeWindowStore.showLayover) {
      activeWindowStore.sendToContentScripts();
    }
  });

  chrome.tabs.onUpdated.addListener(async () => {
    const { activeWindowStore } = store;

    if (!activeWindowStore.showMatches) {
      return;
    }

    activeWindowStore.sendToContentScripts();
  });

  chrome.tabs.onRemoved.addListener(() => {
    const { activeWindowStore } = store;
    activeWindowStore.setTotalTabsCount();

    activeWindowStore.sendToContentScripts();
  });

  chrome.action.onClicked.addListener(() => {
    const { activeWindowStore } = store;
    activeWindowStore.toggleShowFields();

    activeWindowStore.sendToContentScripts();
  });

  chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle_search_layover') {
      const { activeWindowStore } = store;
      activeWindowStore.toggleShowFields();

      activeWindowStore.sendToContentScripts();
    }
  });
}
