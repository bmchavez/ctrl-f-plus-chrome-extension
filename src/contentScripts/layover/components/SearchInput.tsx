// src/components/SearchInput.tsx

import {
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid';
import { tw } from 'twind';
import React, {
  FormEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
// import '../../../tailwind.css';
import { LayoverContext } from '../../contexts/LayoverContext';
import { TabStateContext } from '../../contexts/TabStateContext';
import useFindMatches from '../../hooks/useFindMatches';
import useSearchHandler from '../../hooks/useSearchHandler';
import {
  REMOVE_ALL_STYLES,
  RemoveAllStylesMsg,
} from '../../types/message.types';
import { sendMessageToBackground } from '../../utils/messaging/sendMessageToBackground';
// import '../styles.css';

type SearchInputProps = {
  focus: boolean;
};

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
    sendMessageToBackground<RemoveAllStylesMsg>({ type: REMOVE_ALL_STYLES });
  };

  // TODO: CLEANUP:
  //  - Add debounce
  //  - remove lastSearchValue and all related code
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
  }, [focus, initialLoad, localSearchValue]);

  useEffect(() => {
    if (
      tabStateContext.globalMatchIdxStart !== undefined &&
      tabStateContext.currentIndex !== undefined
    ) {
      const currentMatchIndex =
        tabStateContext.globalMatchIdxStart + tabStateContext.currentIndex + 1;

      setMatchingCounts(`${currentMatchIndex}/${totalMatchesCount}`);
    }
  }, [totalMatchesCount, tabStateContext, showLayover, showMatches]);

  return (
    // <div id="ctrl-f-search-input">
    //   <div
    //     // className="overlay-wrapper"
    //     className=" bg-[rgba(17,24,39,0.9)] rounded font-sans"
    //   >
    //     <form
    //       onSubmit={handleSearchSubmit}
    //       // className="w-full p-2 text-white bg-black bg-opacity-75 rounded grid grid-cols-4 divide-x divide-slate-200"
    //       // className={tw`w-full p-2 text-white bg-black bg-opacity-75 rounded grid grid-cols-4 divide-x divide-slate-200`}
    //       className={tw`w-full p-2 h-full bg-[rgba(17,24,39,0.9)] rounded-md m-0 grid p-[2px]_0 text-white grid-cols-4 items-center`}
    //       // className="form-wrapper"
    //       data-testid="inputForm"
    //     >
    //       <div
    //         // className="col-span-3 grid grid-cols-6 gap-0"
    //         className={tw`col-span-3 grid grid-cols-6 gap-0`}
    //         // className="form-div"
    //       >
    //         <input
    //           ref={searchInputRef}
    //           type="text"
    //           value={localSearchValue}
    //           onChange={handleInputChange}
    //           // className="text-white placeholder-white bg-transparent focus:outline-none col-start-1 col-end-6"
    //           className={tw`text-white placeholder-white bg-transparent focus:outline-none col-start-1 col-end-6`}
    //           // className="input-style"
    //           placeholder="Find on page"
    //         />
    //         <div
    //           // className="mx-2 my-auto"
    //           className={tw`"mx-2 my-auto"`}
    //           // className="matching-counts-wrapper"
    //         >
    //           <p
    //             // className="text-right float-right"
    //             className={tw`text-right float-right`}
    //             // className="matching-counts"
    //           >
    //             {matchingCounts}
    //           </p>
    //         </div>
    //       </div>

    //       <button
    //         type="submit"
    //         //  className="hidden"
    //         className={tw`hidden`}
    //         aria-label="Submit"
    //       />

    //       <div
    //         // className="btn-group"
    //         className={tw`flex justify-evenly items-center`}
    //       >
    //         <div
    //           // className="divider-x"
    //           className={tw`pl-0 pr-0 ml-0 mr-0 border-gray-500 border-l-2 h-7 border-double`}
    //         />

    //         {/* FIXME: Hacky, intermixing custom css and tailwind css on button elements to implement the active:rings */}
    //         <button
    //           onClick={previousMatch}
    //           type="button"
    //           id="previous-match-btn"
    //           data-testid="previous-match-btn"
    //           // className="next-prev-btn active:ctrl-ring-2 active:ctrl-ring-white "
    //           className={tw`inline-flex p-[0.125rem] text-white rounded-full hover:bg-gray-500 active:rounded-full`}
    //           disabled={localSearchValue === ''}
    //         >
    //           <span
    //             // className="sr-only"
    //             className={tw`sr-only`}
    //           >
    //             Previous
    //           </span>
    //           <ChevronUpIcon
    //             // className="btn-icon"
    //             className={tw`h-5 w-5`}
    //             aria-hidden="true"
    //           />
    //         </button>

    //         <button
    //           onClick={nextMatch}
    //           type="button"
    //           id="next-match-btn"
    //           data-testid="next-match-btn"
    //           // className="next-prev-btn active:ctrl-ring-2 active:ctrl-ring-white"
    //           className={tw`group relative focus:outline-none w-5 h-5 p-1 rounded-full active:ring-2 active:ring-white`}
    //           disabled={localSearchValue === ''}
    //         >
    //           <span
    //             // className="sr-only"
    //             className={tw`sr-only`}
    //           >
    //             Next
    //           </span>
    //           <ChevronDownIcon
    //             // className="btn-icon"
    //             className={tw`h-5 w-5`}
    //             aria-hidden="true"
    //           />
    //         </button>

    //         <button
    //           onClick={closeSearchLayover}
    //           type="button"
    //           id="close-layover-btn"
    //           data-testid="close-layover-btn"
    //           // className="x-mark-btn focus:ctrl-ring-2 focus:ctrl-ring-red-600"
    //           className={tw`inline-flex p-0.5 text-white rounded-full focus:ring-2 focus:ring-red-600`}
    //         >
    //           <span
    //             // className="sr-only"
    //             className={tw`sr-only`}
    //           >
    //             Dismiss
    //           </span>
    //           <XMarkIcon
    //             // className="btn-icon"
    //             className={tw`h-5 w-5`}
    //             aria-hidden="true"
    //           />
    //         </button>
    //       </div>
    //     </form>
    //   </div>
    // </div>
    <div id="ctrl-f-search-input">
      <div className="overlay-wrapper bg-[rgba(17,24,39,0.9)] rounded-md font-sans">
        <form
          onSubmit={handleSearchSubmit}
          className="form-wrapper w-full h-full bg-[rgba(17,24,39,0.9)] rounded-md m-0 grid p-[2px]_0 text-white grid-cols-4 items-center"
          data-testid="inputForm"
        >
          <div className="form-div grid relative grid-cols-6 col-span-3 gap-0">
            <input
              ref={searchInputRef}
              type="text"
              value={localSearchValue}
              onChange={handleInputChange}
              className="input-style block p-2 bg-transparent text-white text-base leading-6 w-full rounded-md border-0 border-transparent col-start-1 col-end-6"
              placeholder="Find on page"
            />
            <div className="matching-counts-wrapper flex absolute top-0 bottom-0 right-0 pr-3 items-center pointer-events-none">
              <p className="matching-counts text-gray-400 text-base leading-6 text-white">
                {matchingCounts}
              </p>
            </div>
          </div>

          <button type="submit" className="hidden" aria-label="Submit" />

          <div className="btn-group flex justify-evenly items-center">
            <div className="divider-x pl-0 pr-0 ml-0 mr-0 border-gray-400 border-l-2 h-7 border-double" />

            <button
              onClick={previousMatch}
              type="button"
              id="previous-match-btn"
              data-testid="previous-match-btn"
              className="next-prev-btn inline-flex p-[0.125rem] text-white rounded-full active:ctrl-ring-2 active:ctrl-ring-white"
              disabled={localSearchValue === ''}
            >
              <span className="sr-only absolute w-px h-px p-0 m-[0px] overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0">
                Previous
              </span>
              <ChevronUpIcon className="btn-icon h-5 w-5" aria-hidden="true" />
            </button>

            <button
              onClick={nextMatch}
              type="button"
              id="next-match-btn"
              data-testid="next-match-btn"
              className="next-prev-btn inline-flex p-[0.125rem] text-white rounded-full active:ctrl-ring-2 active:ctrl-ring-white"
              disabled={localSearchValue === ''}
            >
              <span className="sr-only absolute w-px h-px p-0 m-[0px] overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0">
                Next
              </span>
              <ChevronDownIcon
                className="btn-icon h-5 w-5"
                aria-hidden="true"
              />
            </button>

            <button
              onClick={closeSearchLayover}
              type="button"
              id="close-layover-btn"
              data-testid="close-layover-btn"
              className="x-mark-btn inline-flex p-[0.125rem] text-white rounded-full focus:ctrl-ring-2 focus:ctrl-ring-red-600"
            >
              <span className="sr-only absolute w-px h-px p-0 m-[0px] overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0">
                Dismiss
              </span>
              <XMarkIcon className="btn-icon h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SearchInput;
