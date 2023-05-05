// src/popup/popup.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import '../tailwind.css';
// import './popup.css';
import SearchInput from '../components/SearchInput';

const App: React.FC<{}> = () => {
  return (
    <>
      <h1>Popup!</h1>

      <div id="cntrl-f-extension" className="">
        <div className="">
          <SearchInput />
        </div>
      </div>
    </>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);

const reactRoot = createRoot(root);
reactRoot.render(<App />);
