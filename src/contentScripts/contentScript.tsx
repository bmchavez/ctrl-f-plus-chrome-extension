// src/contentScript/contentScript.tsx

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import Layover from '../components/Layover';
import SearchInput from '../components/SearchInput';
import { useMessageHandler } from '../hooks/useMessageHandler';
import { MessageFixMe, Messages } from '../interfaces/message.types';
import '../tailwind.css';
import { handleKeyboardCommand } from '../utils/keyboardCommands';
import { removeAllHighlightMatches } from '../utils/searchAndHighlightUtils';
import { clearStoredMatchesObject, setStoredFindValue } from '../utils/storage';
import { injectStyles, removeStyles } from '../utils/styleUtils';
import contentStyles from './contentStyles';
import { useSearchHandler } from '../hooks/useSearchHandler';
import { userOverlayHandler } from '../hooks/useOverlayHandler';

let injectedStyle: HTMLStyleElement;

const App: React.FC<{}> = () => {

  const sendMessageToBackground = async (message: Messages) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  };

  const {
    searchValue,
    setSearchValue,
    handleSearchSubmit,
    handleNext,
    handlePrevious,
  } = useSearchHandler(sendMessageToBackground);

  const {
    showOverlay,
    setShowOverlay,
    toggleSearchOverlay,
    openSearchOverlay,
    closeSearchOverlay,
  } = userOverlayHandler(searchValue, sendMessageToBackground);

  const handleMessage = (
    message: MessageFixMe,
    sender: any,
    sendResponse: any
  ) => {
    console.log('Received message:', message);

    const { type, findValue, command } = message;

    switch (type) {
      case 'switched-active-tab-show-modal':
        setShowOverlay(true);
        break;
      case 'next-match':
      case 'prev-match':
        // debugger;
        // console.log(`(type === 'next-match' || type === 'prev-match')`);
        break;
      case 'remove-styles':
        removeStyles(injectedStyle);
        break;
      case 'add-styles':
        injectedStyle = injectStyles(contentStyles);
        break;
      case 'remove-all-highlight-matches':
        removeAllHighlightMatches();
        sendResponse({ success: true });
        break;
      default:
        if (command) {
          handleKeyboardCommand(command, {
            toggleSearchOverlay,
          });
        }
        break;
    }
  };

  useMessageHandler(handleMessage);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showOverlay) {
        closeSearchOverlay(searchValue);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showOverlay, searchValue]);

  return (
    <>
      {showOverlay && (
        <div id="cntrl-f-extension">
          <div className="fixed left-5 top-10 z-[9999] w-screen">
            {' '}
            <Layover>
              <SearchInput
                onSubmit={handleSearchSubmit}
                onNext={handleNext}
                onPrevious={handlePrevious}
                focus={showOverlay}
                onSearchValueChange={setSearchValue}
                onClose={closeSearchOverlay}
              />
            </Layover>
          </div>
        </div>
      )}
    </>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);
ReactDOM.render(<App />, root);
