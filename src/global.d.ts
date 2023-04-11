// src/global.d.ts

declare global {
  interface Window {
    requestIdleCallback: (callback: () => void) => void;

    find: (
      string: string,
      caseSensitive?: boolean,
      backwards?: boolean,
      wrapAround?: boolean,
      wholeWord?: boolean,
      searchInFrames?: boolean,
      showDialog?: boolean
    ) => boolean;
  }
}

export {};
