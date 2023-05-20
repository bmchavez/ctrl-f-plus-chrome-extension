// src/contexts/LayoverContext.tsx

import React, { createContext } from 'react';
import { LayoverPosition } from '../components/Layover';
import { useLayoverHandler } from '../hooks/useLayoverHandler';
import {
  LayoverContextData,
  LayoverProviderProps,
} from '../types/layoverContext.types';
import { TabState } from '../types/tab.types';

export const LayoverContext = createContext<LayoverContextData>({
  showLayover: false,
  setShowLayover: () => {},
  searchValue: '',
  setSearchValue: () => {},
  lastSearchValue: '',
  setLastSearchValue: () => {},
  showMatches: false,
  setShowMatches: () => {},
  totalMatchesCount: 0,
  setTotalMatchesCount: () => {},
  globalMatchIdx: 0,
  setGlobalMatchIdx: () => {},
  layoverPosition: null,
  setLayoverPosition: (value: LayoverPosition | null) => {},
  state2Context: {
    tabId: undefined,
    currentIndex: undefined,
    matchesCount: undefined,
    matchesObj: [],
    globalMatchIdxStart: undefined,
  },
  setState2Context: (value: TabState) => {},
  incrementMatchIndices: () => {},
});

export const LayoverProvider: React.FC<LayoverProviderProps> = ({
  children,
}) => {
  const {
    showLayover,
    setShowLayover,
    lastSearchValue,
    setLastSearchValue,
    searchValue,
    setSearchValue,
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
    incrementMatchIndices,
  } = useLayoverHandler();

  return (
    <LayoverContext.Provider
      value={{
        showLayover,
        setShowLayover,
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
        incrementMatchIndices,
      }}
    >
      {children}
    </LayoverContext.Provider>
  );
};
