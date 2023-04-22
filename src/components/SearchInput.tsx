// src/components/SearchInput.tsx

import {
  faAngleDown,
  faAngleUp,
  faCircle,
  faTimes,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { SearchInputProps } from '../interfaces/searchInput.types';
import { getStoredFindValue } from '../utils/storage';
import { FaAngleUp } from 'react-icons/fa';
import { TfiAngleUp } from 'react-icons/tfi';

const SearchInput: React.FC<SearchInputProps> = ({
  onSubmit,
  onNext,
  onPrevious,
  focus,
  onSearchValueChange,
  onClose,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [initialLoad, setInitialLoad] = useState(true);

  // TODO: ADD FUNCTIONALITY TO HIGHLIGHT ALL MATCHES ON CURRENT PAGE AS THE USER TYPES

  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // const storedFindValue = await getStoredFindValue();

    if (searchInputRef.current) {
      const findValue = searchInputRef.current.value;

      // if (storedFindValue !== findValue && TODO: NOTHING IS HIGHLIGHTED/NO MATCHES EXIST) {
      onSubmit(findValue);
      // } else {
      // handleNext();
      // }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setSearchValue(newValue);
    setInitialLoad(false);
    // TODO: check if you still need onSearchValueChange() and compare to setSearchValue():
    onSearchValueChange(newValue);
  };

  const handleNext = () => {
    onNext();
  };

  const handlePrevious = () => {
    onPrevious();
  };

  const handleClose = () => {
    onClose(searchValue);
  };

  useEffect(() => {
    onSearchValueChange(searchValue);
  }, [searchValue, onSearchValueChange]);

  useEffect(() => {
    if (focus && searchInputRef.current) {
      searchInputRef.current.focus();

      if (searchValue && initialLoad) {
        searchInputRef.current.select();
        setInitialLoad(false);
      }
    }
  }, [focus, searchValue]);

  useEffect(() => {
    const fetchStoredFindValue = async () => {
      const storedFindValue = await getStoredFindValue();
      setSearchValue(storedFindValue);
    };

    fetchStoredFindValue();
  }, []);

  return (
    <>
      {/* Add this div for the border-like line */}

      <form
        onSubmit={handleSearchSubmit}
        className="w-full p-2 text-white bg-black bg-opacity-75 rounded grid grid-cols-4 divide-x divide-slate-200"
      >
        <div className="col-span-3 grid grid-cols-6 gap-0 ">
          <input
            ref={searchInputRef}
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            className="text-white placeholder-white bg-transparent focus:outline-none col-start-1 col-end-6 "
            placeholder="Find on page"
          />
          <div className="mx-2 my-auto">
            {/* <p className=" bg-red-500 text-right float-right">1/10000</p> */}
          </div>
        </div>

        <button type="submit" className="hidden" />

        <div className=" flex justify-evenly items-center">
          <button
            type="button"
            onClick={handlePrevious}
            className="group relative focus:outline-none w-5 h-5 p-1 rounded-full"
            disabled={searchValue === ''}
          >
            {' '}
            <div className="flex items-center justify-center h-full">
              <FontAwesomeIcon
                size="sm"
                icon={faAngleUp}
                className="text-slate-200 z-10 group-hover:text-white group-disabled:text-slate-200"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-white bg-opacity-0 group-hover:bg-opacity-30 group-disabled:bg-opacity-0 transition-opacity"></div>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="group relative focus:outline-none w-5 h-5 p-1 rounded-full"
            disabled={searchValue === ''}
          >
            {' '}
            <div className="flex items-center justify-center h-full">
              <FontAwesomeIcon
                size="sm"
                icon={faAngleDown}
                className="text-slate-200 z-10 group-hover:text-white group-disabled:text-slate-200 mt-0.5"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-white bg-opacity-0 group-hover:bg-opacity-30 group-disabled:bg-opacity-0 transition-opacity"></div>
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="group relative focus:outline-none w-5 h-5 p-1 rounded-full"
          >
            {' '}
            <div className="flex items-center justify-center h-full">
              <FontAwesomeIcon
                size="sm"
                icon={faXmark}
                className="text-slate-200 z-10 group-hover:text-red-400"
              />
            </div>
            <div className="absolute inset-0 rounded-full bg-white bg-opacity-0 group-hover:bg-opacity-30 transition-opacity"></div>
          </button>
        </div>
      </form>
    </>
  );
};

export default SearchInput;
{
  /* <button
            type="button"
            onClick={handlePrevious}
            className="group focus:outline-none"
            disabled={searchValue === ''}
          >
            <div className=" flex items-center justify-center relative w-10 h-10 bg-transparent focus:outline-none">
              <FontAwesomeIcon icon={faAngleUp} className="text-white" />
              <FontAwesomeIcon
                icon={faCircle}
                className="text-black bg-opacity-95 hidden group-hover:block "
              />{' '}
            </div>
          </button> */
}
{
  /* <button
  type="button"
  onClick={handleNext}
  className="bg-transparent hover:bg-opacity-75 focus:outline-none"
  disabled={searchValue === ''} //FIXME: review this functionality and style it
>
  <FontAwesomeIcon icon={faAngleDown} />
</button>; */
}

//  <button
//    type="button"
//    onClick={handleClose}
//    className="bg-transparent hover:bg-opacity-75 focus:outline-none"
//  >
//    <FontAwesomeIcon icon={faXmark} />
//  </button>;
