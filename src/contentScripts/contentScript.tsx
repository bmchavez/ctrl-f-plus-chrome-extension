// src/contentScript/contentScript.tsx

import { isEqual } from 'lodash';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TabStore } from '../background/store';
import Layover from '../components/Layover';
import SearchInput from '../components/SearchInput';
import { LayoverContext, LayoverProvider } from '../contexts/LayoverContext';
import { useFindMatches } from '../hooks/useFindMatches';
import { useMessageHandler } from '../hooks/useMessageHandler';
import '../tailwind.css';
import {
  CLOSE_SEARCH_OVERLAY_MESSAGE,
  MessageFixMe,
  UpdateTabStatesObjMsg,
} from '../types/message.types';
import {
  SerializedTabState,
  TabId,
  TabState,
  ValidTabId,
} from '../types/tab.types';
import {
  deserializeMatchesObj,
  restoreHighlightSpans,
  serializeMatchesObj,
} from '../utils/htmlUtils';
import { removeAllHighlightMatches } from '../utils/matchUtils/highlightUtils';
import { createUpdateTabStatesObjMsg } from '../utils/messageUtils/createMessages';
import {
  sendMessageToBackground,
  sendMsgToBackground,
} from '../utils/messageUtils/sendMessageToBackground';
import { injectStyles } from '../utils/styleUtils';
import contentStyles from './contentStyles';

let injectedStyle: HTMLStyleElement;

const App: React.FC<{}> = () => {
  const [activeTabId, setActiveTabId] = useState<number | undefined>(undefined);

  injectStyles(contentStyles);
  const {
    showLayover,
    setShowLayover,
    toggleSearchLayover,
    searchValue,
    setSearchValue,
    lastSearchValue,
    setLastSearchValue,
    showMatches,
    setShowMatches,
    totalMatchesCount,
    setTotalMatchesCount,
    globalMatchIdx,
    setGlobalMatchIdx,
    layoverPosition,
    setLayoverPosition,
    state2Context,
    setState2Context,
  } = useContext(LayoverContext);

  const { updateHighlights, findAllMatches } = useFindMatches();

  const updateContextFromStore = async (
    tabStore: TabStore,
    tabId: ValidTabId
  ) => {
    setSearchValue(tabStore.searchValue);
    setLastSearchValue(tabStore.lastSearchValue);
    setShowLayover(tabStore.showLayover);
    setShowMatches(tabStore.showMatches);
    setTotalMatchesCount(tabStore.totalMatchesCount);
    setGlobalMatchIdx(tabStore.globalMatchIdx + 1);
    setLayoverPosition(tabStore.layoverPosition);

    const serializedTabState = tabStore.serializedTabState;
    // const xPathTabState: XPathTabState =
    const xPathTabState = deserializeMatchesObj(serializedTabState);
    const tabState = restoreHighlightSpans(xPathTabState);
    setState2Context({ type: 'SET_STATE2_CONTEXT', payload: tabState });

    // TODO: Make sure this value is getting updated in the tabStore
    if (tabStore.activeTab) {
      setActiveTabId(tabStore.activeTab.id);
    }
  };

  async function handleHighlight(
    state2: TabState,
    findValue: string,
    tabId: TabId
  ): Promise<any> {
    state2.tabId = tabId;
    const newState = await findAllMatches(state2, findValue);

    newState.tabId = tabId;

    const serializedState: SerializedTabState = serializeMatchesObj({
      ...newState,
    });

    return {
      hasMatch: newState.matchesObj.length > 0,
      serializedState: serializedState,
      state2: newState,
    };
  }

  let lastProcessedTransactionId = '0'; //FIXME: Should this be state?

  const handleMessage = useCallback(
    async (message: MessageFixMe, sender: any, sendResponse: any) => {
      const stateOnlyContext = {
        showLayover,
        searchValue,
        lastSearchValue,
        showMatches,
        totalMatchesCount,
        globalMatchIdx,
        layoverPosition,
        state2Context,
      };

      console.log('Received message:', message);

      const { type, command, transactionId } = message;

      if (transactionId && transactionId <= lastProcessedTransactionId) {
        console.log('Ignoring message:', message);
        return;
      }

      let serializedtabState: SerializedTabState;
      let tabState: TabState;
      let findValue;
      let state2;
      let tabId;
      let response;

      switch (type) {
        case 'switched-active-tab-show-layover':
          showMatches && setShowLayover(true);
          break;
        case 'switched-active-tab-hide-layover':
          showMatches && setShowLayover(false);
          break;
        case 'add-styles':
          serializedtabState =
            message.payload.store.tabStates[message.payload.tabId];

          response = { status: 'success' };

          if (serializedtabState === undefined) {
            sendResponse(response);
            break;
          }

          deserializeMatchesObj(serializedtabState);
          tabState = deserializeMatchesObj({
            ...serializedtabState,
          });

          tabState = restoreHighlightSpans(tabState);
          //FIXME: DRY and/or REFACTOR AS RESPONSE:
          const serializedState: SerializedTabState = serializeMatchesObj({
            ...tabState,
          });

          // FIXME: REVIEW //////////////////////////
          // const msg = createUpdateTabStatesObjMsg(serializedState); // if you keep this here, it should probably be a `response`
          // sendMsgToBackground<UpdateTabStatesObjMsg>(msg);

          sendResponse(response); // FIXME: review this: might want to have status be more conditional at this point
          // FIXME: REVIEW //////////////////////////
          break;
        case 'remove-all-highlight-matches':
          removeAllHighlightMatches();
          sendResponse({ success: true });
          break;
        case 'update-matches-count':
          setTotalMatchesCount(message.payload.totalMatchesCount);
          break;
        case 'store-updated':
          const { tabStore } = message.payload;
          tabId = message.payload.tabId;

          updateContextFromStore(tabStore, tabId);
          break;
        case 'highlight':
          tabId = message.tabId;
          state2 = { ...state2Context, tabId: tabId };
          findValue = message.findValue as string;
          response = await handleHighlight(state2, findValue, tabId);
          state2 = response.state2;

          if (response.hasMatch && !message.foundFirstMatch) {
            if (!isEqual(state2, state2Context)) {
              setState2Context({
                type: 'SET_STATE2_CONTEXT',
                payload: state2,
              });
            }

            state2 = updateHighlights(state2, message.prevIndex, false);

            const serializedState: SerializedTabState = serializeMatchesObj({
              ...state2,
            });

            response = {
              ...response,
              serializedState: serializedState,
              hasMatch: true,
            };
          }

          if (!isEqual(state2, state2Context)) {
            setState2Context({ type: 'SET_STATE2_CONTEXT', payload: state2 });
          }

          sendResponse(response);
          return true;
        case 'update-highlights':
          tabId = message.payload.tabId;
          state2 = { ...state2Context, tabId: tabId };
          const newState = updateHighlights(state2, message.prevIndex, false);

          if (!isEqual(state2, state2Context)) {
            setState2Context({ type: 'SET_STATE2_CONTEXT', payload: newState });
          }
          sendResponse({ status: 'success' });
          return true;

        default:
          break;
      }
      return true;
    },
    [
      handleHighlight,
      state2Context,
      updateHighlights,
      setState2Context,
      LayoverContext,

      showLayover,
      searchValue,
      lastSearchValue,
      showMatches,
      totalMatchesCount,
      globalMatchIdx,
      layoverPosition,
    ]
  );

  useMessageHandler(handleMessage);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLayover) {
        toggleSearchLayover(false);

        // // FIXME: refactor so that the message doesn't get set to this tab?
        // const msg: CLOSE_SEARCH_OVERLAY_MESSAGE = {
        //   from: 'content',
        //   type: 'CLOSE_SEARCH_OVERLAY',
        //   payload: {},
        // };
        // sendMessageToBackground(msg);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLayover, showMatches, searchValue]);

  useEffect(() => {
    const rmvHltMatches = async () => {
      await sendMessageToBackground({
        from: 'content',
        type: 'remove-all-highlight-matches',
      });
    };

    return () => {
      showMatches && rmvHltMatches();
    };
  }, [showMatches]);

  // useEffect(() => {
  //   console.log('state2Context updated: ', state2Context);
  // }, [state2Context]);

  // useEffect(() => {
  //   console.log('totalMatchesCount updated: ', totalMatchesCount);
  // }, [totalMatchesCount]);

  return (
    <>
      {showLayover && (
        <div id="cntrl-f-extension">
          <div className="fixed left-5 top-10 z-[9999] w-screen">
            {' '}
            <Layover activeTabId={activeTabId}>
              <SearchInput focus={showLayover} />
            </Layover>
          </div>
        </div>
      )}
    </>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);

const reactRoot = createRoot(root);

reactRoot.render(
  <React.StrictMode>
    <LayoverProvider>
      <App />
    </LayoverProvider>
  </React.StrictMode>
);
