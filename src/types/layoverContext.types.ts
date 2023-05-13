// src/interfaces/layoverContext.types.ts

import { ReactNode } from 'react';
import { LayoverPosition } from '../components/Layover';
import { TabState } from './tab.types';

export interface SetState2Action {
  type: 'SET_STATE2';
  payload: TabState | ((prevState2: TabState) => TabState);
}

// export type SetState2Action = TabState | ((prevState2: TabState) => TabState);

export interface LayoverContextData {
  showLayover: boolean;
  setShowLayover: (value: boolean) => void;
  toggleSearchLayover: (forceShowLayover?: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  lastSearchValue: string;
  setLastSearchValue: (value: string) => void;
  showMatches: boolean;
  setShowMatches: (value: boolean) => void;
  totalMatchesCount: number;
  setTotalMatchesCount: (value: number) => void;
  globalMatchIdx: number;
  setGlobalMatchIdx: (value: number) => void;
  // layoverPosition: LayoverPosition;
  // setLayoverPosition: (value: LayoverPosition) => void;
  layoverPosition: LayoverPosition | null;
  setLayoverPosition: (value: LayoverPosition | null) => void;
  state2: TabState;
  // setState2: (value: TabState) => void;
  // setState2: React.Dispatch<TabState | ((prevState2: TabState) => TabState)>;
  // setState2: React.Dispatch<SetState2Action>;

  setState2: (value: SetState2Action) => void;
}

export interface LayoverProviderProps {
  children: ReactNode;
}

export interface LayoverState {
  showLayover: boolean;
  showMatches: boolean;
  searchValue: string;
  lastSearchValue: string;
  totalMatchesCount: number;
  globalMatchIdx: number;
  // layoverPosition: LayoverPosition;
  layoverPosition: LayoverPosition | null;
  state2: TabState;
}

export type LayoverAction =
  | {
      type: 'INITIALIZE_STATE';
      payload: LayoverState;
    }
  | { type: 'SET_SHOW_LAYOVER'; payload: boolean }
  | { type: 'SET_SHOW_MATCHES'; payload: boolean }
  | { type: 'SET_SEARCH_VALUE'; payload: string }
  | { type: 'SET_LAST_SEARCH_VALUE'; payload: string }
  | { type: 'SET_TOTAL_MATCHES_COUNT'; payload: number }
  | { type: 'SET_GLOBAL_MATCH_IDX'; payload: number }
  | { type: 'SET_LAYOVER_POSITION'; payload: LayoverPosition | null }
  | { type: 'SET_STATE2'; payload: TabState };
