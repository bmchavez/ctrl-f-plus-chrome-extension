// src/components/SearchInput.tsx

import {
  faAngleDown,
  faAngleUp,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, {
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { LayoverContext } from '../contexts/LayoverContext';
import { TabStateContext } from '../contexts/TabStateContext';
import useFindMatches from '../hooks/useFindMatches';
import useSearchHandler from '../hooks/useSearchHandler';
import { sendMessageToBackground } from '../utils/messageUtils/sendMessageToBackground';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';

const additionalStyles0 = `
body {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
}

.testingtesting123 {
    width: 434px !important;
    height: 36px !important;
    position: fixed !important;
    top: 0px !important;
    right: 0px !important;
    z-index: 2147483647 !important;
    background-color: red !important;
    box-shadow: 0px 0px 5px #0000009e !important;
}

.pt-0\.5 {
  padding-top: 0.125rem/* 2px */ !important;
}

.pb-0\.5 {
  padding-bottom: 0.125rem/* 2px */ !important;
}

.text-white {
  --tw-text-opacity: 1 !important;
  color: rgb(255 255 255 / var(--tw-text-opacity)) !important;
}

.bg-white\/5 {
  background-color: rgb(255 255 255 / 0.05) !important;
}

.grid {
  display: grid !important;
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
}


//
.w-full {
  width: 100% !important;
}

.h-full {
  height: 100% !important;
}

.text-white {
  --tw-text-opacity: 1 !important;
  color: rgb(255 255 255 / var(--tw-text-opacity)) !important;
}

.bg-black {
  --tw-bg-opacity: 1 !important;
  background-color: rgb(0 0 0 / var(--tw-bg-opacity)) !important;
}

.bg-opacity-75 {
  --tw-bg-opacity: 0.75 !important;
}

.rounded {
  border-radius: 0.25rem/* 4px */ !important;
}

.grid {
  display: grid !important;
}
.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
}

.divide-x > :not([hidden]) ~ :not([hidden]) {
  --tw-divide-x-reverse: 0 !important;
  border-right-width: calc(1px * var(--tw-divide-x-reverse)) !important;
  border-left-width: calc(1px * calc(1 - var(--tw-divide-x-reverse))) !important;
}

.divide-slate-200 > :not([hidden]) ~ :not([hidden]) {
  --tw-divide-opacity: 1 !important;
  border-color: rgb(226 232 240 / var(--tw-divide-opacity)) !important;
}
`;

// .testingtesting123 {
// width: 434px !important;
// height: 36px !important;
// position: fixed !important;
// top: 0px !important;
// right: 0px !important;
// z-index: 2147483647 !important;
// background-color: red !important;
// box-shadow: 0px 0px 5px #0000009e !important;
// padding: 0px !important;
// margin: 0px !important;
// --tw-bg-opacity: 1 !important;
// background-color: rgb(30 41 59 / var(--tw-bg-opacity)) !important;
// font-family: sans-serif;
// }

/*
.x-mark-btn:focus {
 box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
--ring-color: #DC2626;
outline: 0;
 }
*/

const additionalStyles = `
.testingtesting123 {
      width: 434px !important;
    height: 36px !important;
    position: fixed !important;
    top: 0px !important;
    right: 0px !important;
    z-index: 2147483647 !important;
    box-shadow: 0px 0px 5px #0000009e !important;
    padding: 0px !important;
    margin: 0px !important;
    font-family: sans-serif;
    background-color: #111827;

}


.form-wrap {
  width: 100%;
  height: 100%;
  display: grid;
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
  color: #ffffff !important;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.form-div {
display: grid;
position: relative;
grid-template-columns: repeat(6, minmax(0, 1fr));
grid-column: span 3 / span 3;
gap: 0;
  font-size: 16px !important;
line-height: 24px !important;

}

.input-style {
background-color: transparent;
color: #ffffff;

/*color: #6B7280;

*/
border-color: transparent;
grid-column-start: 1;
grid-column-end: 6;
    font-size: 16px !important;
line-height: 24px !important;


}

.input-style:focus{
   border-color: transparent !important;
   outline: none !important;
}



.input-style::placeholder {
  --tw-placeholder-opacity: 1 !important;
  color: rgb(107 114 128 / var(--tw-placeholder-opacity)) !important;
}

.matching-counts-wrapper {
display: flex;
position: absolute;
top: 0;
bottom: 0;
right: 0;
padding-right: 0.75rem;
align-items: center;
pointer-events: none;

}

.matching-counts {
color: #6B7280;
/*font-size: 1rem;
line-height: 1.5rem;*/
    font-size: 16px !important;
line-height: 24px !important;
}

.hidden {
  display: none !important;
}

.btn-group {
  display: flex;
  justify-content: space-evenly;
  align-items: center;

}

.divider-x {
  padding-left: 0;
  padding-right: 0;
  margin-left: 0;
  margin-right: 0;
  border-left-width: 1px;
  border-color: #6B7280;
  border-color: #FFFFFF;

}
.h5w5{
  height: 20px !important;
  width: 20px !important;
}

.next-prev-btn {
  display: inline-flex;
  padding: 0.125rem;
  color: #ffffff;
  border-radius: 9999px;
  background-color: #111827;
}

.next-prev-btn:hover {
  background-color: #6B7280;
}


.sr-only {
position: absolute;
width: 1px;
height: 1px;
padding: 0;
margin: -1px;
overflow: hidden;
clip: rect(0, 0, 0, 0);
whiteSpace: nowrap;
borderWidth: 0;

}


.x-mark-btn {
  display: inline-flex;
  padding: 0.125rem;
  color: #ffffff;
  border-radius: 9999px;
  background-color: #111827;
}

.x-mark-btn:hover {
  background-color: #6B7280;
  color: #F87171;
}

`;

// FIXME: Test this to see if you can just use showLayover directly instead of focus
interface SearchInputProps {
  focus: boolean; // or whatever type `focus` is supposed to be
}

function SearchInput({ focus }: SearchInputProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const {
    searchValue,
    showLayover,
    showMatches,
    lastSearchValue,
    totalMatchesCount,
  } = useContext(LayoverContext);
  const { tabStateContext } = useContext(TabStateContext);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const [matchingCounts, setMatchingCounts] = useState('0/0');

  const { nextMatch, previousMatch } = useFindMatches();
  const { handleSearch } = useSearchHandler();

  // TODO: Review to decide if you want to handle this in another way
  const closeSearchLayover = () => {
    sendMessageToBackground({
      from: 'content',
      type: 'remove-styles-all-tabs',
    });
  };

  // TODO: CLEANUP:
  //  - Add debounce
  //  - remove lastSearchValue and all realted code
  //  - try adding e.preventDefault to handleNext()
  //  - update searchInput count
  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (searchInputRef.current) {
      if (localSearchValue === lastSearchValue) {
        nextMatch();
      } else {
        handleSearch(localSearchValue);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setLocalSearchValue(newValue);
    setInitialLoad(false);
  };

  useEffect(() => {
    if (focus && searchInputRef.current) {
      searchInputRef.current.focus();

      if (localSearchValue && initialLoad) {
        searchInputRef.current.select();
        setInitialLoad(false);
      }
    }
  }, [focus, localSearchValue]);

  useEffect(() => {
    if (
      tabStateContext.globalMatchIdxStart !== undefined &&
      tabStateContext.currentIndex !== undefined
    ) {
      const curIdxRENAME_ME =
        tabStateContext.globalMatchIdxStart + tabStateContext.currentIndex + 1;

      setMatchingCounts(`${curIdxRENAME_ME}/${totalMatchesCount}`);
      // console.log(`${new Date().getTime()}`, ': ', matchingCounts);
    }
  }, [totalMatchesCount, tabStateContext, showLayover, showMatches]);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);

    // Cleanup function
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="testingtesting123">
      {' '}
      <form onSubmit={handleSearchSubmit} className="form-wrap">
        <div className="form-div">
          <input
            type="text"
            ref={searchInputRef}
            value={localSearchValue}
            onChange={handleInputChange}
            placeholder="Find on page"
            className="input-style"
          />
          {/* <div className="mx-2 my-auto">
            <p className="text-gray-500 text-right float-right">{matchingCounts}</p>
            <p className="text-gray-500 text-right float-right font-medium">
              0/10
            </p>
          </div> */}
          <div className="matching-counts-wrapper">
            <span className="matching-counts">{matchingCounts}</span>
          </div>
        </div>

        <button type="submit" className="hidden" aria-label="Submit" />

        <div className="btn-group">
          <div className="divider-x" />

          <button
            onClick={previousMatch}
            type="button"
            className="next-prev-btn"
            disabled={localSearchValue === ''}
          >
            <span className="sr-only">Previous</span>
            <ChevronUpIcon className="h5w5" aria-hidden="true" />
          </button>

          <button
            onClick={nextMatch}
            type="button"
            className="next-prev-btn"
            disabled={localSearchValue === ''}
          >
            <span className="sr-only">Previous</span>
            <ChevronDownIcon className="h5w5" aria-hidden="true" />
          </button>

          <button
            onClick={closeSearchLayover}
            type="button"
            className="x-mark-btn"
          >
            <span className="sr-only">Dismiss</span>
            <XMarkIcon className="h5w5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default SearchInput;
