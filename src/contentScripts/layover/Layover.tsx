import React, { useCallback, useContext } from 'react';
import { TabStore } from '../../background/types/Store.types';
import {
  HIGHLIGHT,
  REMOVE_HIGHLIGHT_MATCHES,
  ToLayoverMessage,
  UPDATED_STORE,
  UPDATE_HIGHLIGHTS,
} from '../../background/types/message.types';
import '../../tailwind.css';
import { LayoverContext } from '../contexts/LayoverContext';
import { TabStateContext } from '../contexts/TabStateContext';
import useActiveTabChange from '../hooks/useActiveTabChange';
import useEscapeKeyDown from '../hooks/useEscapeKeydown';
import useFindMatches from '../hooks/useFindMatches';
import useMessageHandler from '../hooks/useMessageHandler';
import useRemoveAllHighlightMatches from '../hooks/useRemoveAllHighlightMatches';
import { XPathTabState } from '../types/tab.types';
import removeAllHighlightMatches from '../utils/dom/removeAllHighlightMatches';
import restoreHighlightSpans from '../utils/dom/restoreHighlightSpans';
import deserializeTabState from '../utils/serialization/deserializeTabState';
import serializeTabState from '../utils/serialization/serializeTabState';
import DraggableContainer from './components/DraggableContainer';
import SearchInput from './components/SearchInput';
import { ResponseCallback } from '../../shared/types/shared.types';
import log from '../../shared/utils/logger';

function Layover() {
  const {
    showLayover,
    setShowLayover,
    setSearchValue,
    setLastSearchValue,
    setShowMatches,
    setTotalMatchesCount,
    setLayoverPosition,
    setActiveTabId,
  } = useContext(LayoverContext);
  const { tabStateContext, setTabStateContext } = useContext(TabStateContext);
  const { updateHighlights, findAllMatches } = useFindMatches();

  // TODO: review how often this is rendered
  const updateContextFromStore = useCallback(
    async (tabStore: TabStore) => {
      setSearchValue(tabStore.searchValue);
      setLastSearchValue(tabStore.lastSearchValue);
      setShowLayover(tabStore.showLayover);
      setShowMatches(tabStore.showMatches);
      setTotalMatchesCount(tabStore.totalMatchesCount);
      setLayoverPosition(tabStore.layoverPosition);
      setActiveTabId(tabStore.activeTabId);

      const { serializedTabState } = tabStore;
      const xPathTabState: XPathTabState =
        deserializeTabState(serializedTabState);
      const tabState = restoreHighlightSpans(xPathTabState);

      setTabStateContext(tabState);
    },
    [
      setActiveTabId,
      setLastSearchValue,
      setLayoverPosition,
      setSearchValue,
      setShowLayover,
      setShowMatches,
      setTabStateContext,
      setTotalMatchesCount,
    ]
  );

  const handleMessage = useCallback(
    async (
      message: ToLayoverMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: ResponseCallback
    ) => {
      log('Received message:', message);

      const { type } = message;
      let newState;

      switch (type) {
        case UPDATED_STORE: {
          const { tabStore } = message.payload;
          if (tabStore) {
            await updateContextFromStore(tabStore);
            sendResponse(true);
          }

          return true;
        }
        case REMOVE_HIGHLIGHT_MATCHES:
          removeAllHighlightMatches();
          break;
        case HIGHLIGHT: {
          const { searchValue, foundFirstMatch } = message.payload;
          newState = await findAllMatches(searchValue);

          const hasMatch = newState.matchesObj.length > 0;

          if (hasMatch && !foundFirstMatch) {
            newState = updateHighlights(newState, { endOfTab: false });
          }

          setTabStateContext(newState);

          const serializedState = serializeTabState(newState);

          sendResponse({
            hasMatch,
            serializedState,
          });
          return true;
        }
        case UPDATE_HIGHLIGHTS: {
          newState = updateHighlights(
            { ...tabStateContext },
            { endOfTab: false }
          );

          setTabStateContext(newState);

          const newSerializedState = serializeTabState(newState);

          sendResponse({ status: 'success', newSerializedState });
          return true;
        }
        default:
          break;
      }

      return true;
    },
    [
      tabStateContext,
      setTabStateContext,
      updateHighlights,
      updateContextFromStore,
      findAllMatches,
    ]
  );

  useMessageHandler(handleMessage);
  useEscapeKeyDown();
  useActiveTabChange();
  useRemoveAllHighlightMatches();

  return (
    <>
      {' '}
      {showLayover && (
        <div id="ctrl-f-plus-extension">
          <div className="ctrl-fixed ctrl-left-5 ctrl-top-10 ctrl-z-[9999] ctrl-w-screen">
            {' '}
            <DraggableContainer>
              <SearchInput focus={showLayover} />
            </DraggableContainer>
          </div>
        </div>
      )}
    </>
  );
}
export default Layover;
