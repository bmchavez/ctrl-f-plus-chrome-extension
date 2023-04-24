// src/background/background.ts

import {
  Messages,
  SwitchedActiveTabShowModal,
  UpdateHighlightsMessage,
} from '../interfaces/message.types';
// import { getStoredMatchesObject } from '../utils/storage';

const tabStates: { [tabId: number]: any } = {};

// (global as any).getStoredMatchesObject = getStoredMatchesObject;

function executeContentScript(
  findValue: string,
  tab: chrome.tabs.Tab
): Promise<{
  hasMatch: boolean;
  state: any;
}> {
  return new Promise<{ hasMatch: boolean; state: any }>((resolve, reject) => {
    if (tab.id === undefined) {
      console.warn('executeContentScript: Tab ID is undefined:', tab);
      reject({ hasMatch: false, state: null });
      return;
    }

    const tabId = tab.id as number;

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ['getInnerHtmlScript.js'],
      },
      () => {
        chrome.tabs.sendMessage(
          tabId,
          {
            from: 'background',
            type: 'highlight',
            findValue: findValue,
            tabId: tab.id,
            messageId: Date.now(),
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log(chrome.runtime.lastError);
              reject({ hasMatch: false, state: null });
            } else {
              // tabStates[tab.id] = response.state;
              resolve(response);
            }
          }
        );
      }
    );
  });
}

async function executeContentScriptOnAllTabs(findValue: string) {
  const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
    chrome.tabs.query({ currentWindow: true }, resolve);
  });

  const activeTabIndex = tabs.findIndex((tab) => tab.active);
  const orderedTabs = [
    ...tabs.slice(activeTabIndex),
    ...tabs.slice(0, activeTabIndex),
  ];

  let foundFirstMatch = false;
  for (const tab of orderedTabs) {
    if (tab.id) {
      const { hasMatch, state } = await executeContentScript(findValue, tab);

      if (hasMatch && !foundFirstMatch) {
        foundFirstMatch = true;

        chrome.tabs.sendMessage(tab.id, {
          from: 'background',
          type: 'update-highlights',
          state: tabStates[tab.id],
          prevIndex: undefined,
        });
      }
    }
  }
}

function executeContentScriptWithMessage(
  tabId: number,
  messageType: string,
  findValue: string
) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ['getInnerHtmlScript.js'],
    },
    () => {
      // ***2.5
      chrome.tabs.sendMessage(tabId, {
        from: 'background',
        type: messageType,
        findValue,
        tabId,
      });
    }
  );
}

async function switchTab(state, matchesObject) {
  //, prevIndex) {
  // if (state.tab.id === undefined) {
  //   console.warn('switchTab: Tab ID is undefined:', state.tab);
  //   return;
  // }

  const tabIds = Object.keys(matchesObject).map((key) => parseInt(key, 10));
  const currentTabIndex = tabIds.findIndex((tabId) => tabId === state.tabId);
  const nextTabIndex = (currentTabIndex + 1) % tabIds.length;
  const nextTabId = tabIds[nextTabIndex];

  chrome.tabs.update(nextTabId, { active: true }, async (tab) => {
    state.tabId = tab.id;

    state.currentIndex = 0;
    const message: UpdateHighlightsMessage = {
      from: 'background',
      type: 'update-highlights',
      state: state,
      prevIndex: undefined,
    };
    chrome.tabs.sendMessage(tab.id, message);

    const message2: SwitchedActiveTabShowModal = {
      from: 'background',
      type: 'switched-active-tab-show-modal',
    };
    chrome.tabs.sendMessage(tab.id, message2);
  });
}

chrome.runtime.onMessage.addListener(
  (message: Messages, sender, sendResponse) => {
    if (message.type === 'get-all-matches-req') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length) {
          const activeTab = tabs[0];
          chrome.tabs.sendMessage(activeTab.id, {
            from: 'background',
            type: 'get-all-matches-req',
          });
        }
      });

      return;
    }

    // Receive message from SearchInput component
    if (message.type === 'get-all-matches-msg') {
      const findValue = message.payload;

      executeContentScriptOnAllTabs(findValue);

      return;
    }

    if (message.type === 'next-match' || message.type === 'prev-match') {
      // const senderTabId = sender.tab ? sender.tab.id : null;
      // const { type, findValue } = message;

      // if (!senderTabId || !findValue) {
      //   console.warn(`ADD_LOCATION: missing senderTabId or findValue`);
      //   return;
      // }

      // executeContentScriptWithMessage(senderTabId, message.type, findValue);
      // ***2
      executeContentScriptWithMessage(
        sender.tab.id,
        message.type,
        message.findValue
      );
      return;
    }

    if (message.type === 'remove-styles-all-tabs') {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'remove-styles' });
          }
        });
      });

      return;
    }

    if (message.type === 'add-styles-all-tabs') {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'add-styles' });
          }
        });
      });

      return;
    }

    if (message.type === 'remove-all-highlight-matches') {
      chrome.tabs.query({}, (tabs) => {
        const tabPromises = tabs.map((tab) => {
          return new Promise((resolve) => {
            if (tab.id) {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  type: 'remove-all-highlight-matches',
                },
                (response) => {
                  resolve(response);
                }
              );
            } else {
              resolve(null);
            }
          });
        });

        Promise.all(tabPromises).then((responses) => {
          sendResponse(responses);
        });

        return true;
      });
    }

    if (message.type === 'switch-tab') {
      switchTab(message.state, message.matchesObject);
      return;
    }

    if (message.type === 'update-tab-states-obj') {
      const { tabId, state, serializedMatchesObj } = message.payload;

      tabStates[tabId] = state;
      tabStates[tabId].matchesObj = serializedMatchesObj;

      sendResponse({ status: 'success' });
      return;
    }
  }
);

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.sendMessage(tabId, {
    from: 'background',
    type: 'tab-activated',
  });
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle_search_overlay') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { command });
      }
    });
  }
});
