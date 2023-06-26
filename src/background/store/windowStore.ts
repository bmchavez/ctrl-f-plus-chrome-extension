// src/background/windowStore.ts

import { SharedStore, TabStore } from '../../types/Store.types';
import { UpdateStoreMsg } from '../../types/message.types';
import { LayoverPosition } from '../../types/shared.types';
import { SerializedTabState, ValidTabId } from '../../types/tab.types';
import {
  queryCurrentWindowTabs,
  toValidTabId,
} from '../../utils/background/chromeApiUtils';
import { getAllStoredTabs } from '../../utils/background/storage';
import sendMessageToTab from '../../utils/messaging/sendMessageToContentScripts';

interface BasicTabState {
  tabId: ValidTabId;
  serializedTabState: SerializedTabState;
}

export interface WindowStore extends SharedStore {
  updatedTabsCount: number;
  totalTabs: number | undefined;
  tabStores: Record<ValidTabId, BasicTabState>;

  resetPartialStore: () => void;
  update: (updates: Partial<WindowStore>) => void;
  updateLayoverPosition: (newPosition: LayoverPosition) => void;
  setTotalTabsCount: () => void;
  setUpdatedTabsCount: (updatedTabsCount: number) => void;
  updateMatchesCount: () => void;
  updateTotalMatchesCount: (totalMatchesCount: number) => void;
  toggleShowFields: (isVisible?: boolean) => void;
  setActiveTabId: (activeTabId: number) => void;
  createTabStore: (tabId: ValidTabId) => TabStore;
  sendToContentScripts: () => Promise<(boolean | Error)[]>;
}

export const createWindowStore = (): WindowStore => {
  return {
    totalMatchesCount: 0,
    layoverPosition: { x: 0, y: 0 },
    showLayover: false,
    showMatches: false,
    activeTabId: undefined,
    searchValue: '',
    lastSearchValue: '',
    updatedTabsCount: 0,
    totalTabs: undefined,
    tabStores: {},

    update(updates): void {
      Object.assign(this, updates);
      const updatesTabStores = updates.tabStores;

      if (updatesTabStores) {
        Object.keys(updatesTabStores).forEach((tabId) => {
          const validTabId = toValidTabId(Number(tabId));

          if (!this.tabStores[validTabId]) {
            this.tabStores[validTabId] = updatesTabStores[validTabId];
          } else {
            Object.assign(
              this.tabStores[validTabId],
              updatesTabStores[validTabId]
            );
          }
        });
      }
    },

    resetPartialStore(): void {
      const partialInitialState = {
        totalMatchesCount: 0,
        searchValue: '',
        lastSearchValue: '',
        tabStores: {},
      };
      this.update(partialInitialState);
    },

    updateLayoverPosition(newPosition) {
      this.layoverPosition = newPosition;
    },

    async setTotalTabsCount() {
      const tabs = await queryCurrentWindowTabs();
      this.totalTabs = tabs.length;
    },

    setUpdatedTabsCount(updatedTabsCount) {
      this.updatedTabsCount = updatedTabsCount;
    },

    async updateMatchesCount() {
      const storedTabs = await getAllStoredTabs();
      let totalMatchesCount = 0;

      Object.keys(storedTabs).forEach((tabId) => {
        const validTabId = toValidTabId(Number(tabId));
        totalMatchesCount += storedTabs[validTabId]?.matchesCount ?? 0;
      });

      this.totalMatchesCount = totalMatchesCount;
    },

    updateTotalMatchesCount(totalMatchesCount) {
      this.totalMatchesCount = totalMatchesCount;
    },

    toggleShowFields(isVisible) {
      const show = isVisible ?? !this.showLayover;

      this.showLayover = show;
      this.showMatches = show;
    },

    setActiveTabId(activeTabId) {
      this.activeTabId = activeTabId;
    },

    createTabStore(tabId: ValidTabId): TabStore {
      let serializedTabState = this.tabStores[tabId]?.serializedTabState;

      if (serializedTabState === undefined) {
        serializedTabState = {
          tabId,
          currentIndex: 0,
          matchesCount: 0,
          serializedMatches: '',
          globalMatchIdxStart: -1,
        };
      }

      return {
        tabId,
        serializedTabState,
        totalMatchesCount: this.totalMatchesCount,
        layoverPosition: this.layoverPosition,
        showLayover: this.showLayover,
        showMatches: this.showMatches,
        searchValue: this.searchValue,
        lastSearchValue: this.lastSearchValue,
        activeTabId: this.activeTabId,
      };
    },

    async sendToContentScripts(): Promise<(boolean | Error)[]> {
      const currentWindowTabs = await queryCurrentWindowTabs();
      const validatedTabIds = currentWindowTabs
        .map((tab) => tab.id)
        .filter((id): id is ValidTabId => id !== undefined);

      const promises = (validatedTabIds || []).map((tabId) => {
        const tabStore = this.createTabStore(tabId);

        return sendMessageToTab<UpdateStoreMsg>(tabId, {
          async: true,
          from: 'background:store',
          type: 'store-updated',
          payload: {
            tabId,
            tabStore,
          },
        });
      });

      return Promise.all(promises);
    },
  };
};
