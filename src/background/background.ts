// start / src / background / background.ts;
import { Messages, ExecuteContentScript } from '../utils/messages';

function executeContentScript(tabId: number, findValue: string) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ['getInnerHtmlScript.js'],
    },
    () => {
      chrome.tabs.sendMessage(tabId, { type: 'highlight', findValue });
    }
  );
}

function executeContentScriptWithMessage(tabId: number, messageType: string) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tabId },
      files: ['getInnerHtmlScript.js'],
    },
    () => {
      chrome.tabs.sendMessage(tabId, { type: messageType });
    }
  );
}

// TODO: Add Settings option to allow the toggling of currentWindow
function executeContentScriptOnAllTabs(findValue: string) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    for (const tab of tabs) {
      if (tab.id) {
        executeContentScript(tab.id, findValue);
      }
    }
  });
}

chrome.runtime.onMessage.addListener((message: Messages, sender) => {
  if (
    message.from === 'content' &&
    message.type === 'get-inner-html' &&
    message.payload
  ) {
    const { title, innerHtml } = message.payload;
    console.log(
      // `Tab ID: ${sender.tab!.id}, title: ${title}, InnerHTML: ${innerHtml}`
      `Tab ID: ${sender.tab!.id}, title: ${title}`
    );
  }

  // if (message.from === 'content' && message.type === 'execute-content-script') {
  //   const findValue = message.payload;
  //   executeContentScriptOnAllTabs(findValue);
  // }

  if (message.from === 'content' && message.type === 'execute-content-script') {
    const findValue = message.payload;
    executeContentScriptOnAllTabs(findValue);
  } else if (message.from === 'content' && message.type === 'next-match') {
    executeContentScriptWithMessage(sender.tab!.id, 'next-match');
  } else if (message.from === 'content' && message.type === 'previous-match') {
    executeContentScriptWithMessage(sender.tab!.id, 'previous-match');
  }
});
