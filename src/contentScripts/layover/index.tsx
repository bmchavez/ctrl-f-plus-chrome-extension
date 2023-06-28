// src/contentScripts/layover/index.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
// import '../../tailwind.css';
import { LayoverProvider } from '../contexts/LayoverContext';
import { TabStateContextProvider } from '../contexts/TabStateContext';
import Layover from './Layover';

const root = document.createElement('div');
document.body.appendChild(root);

const reactRoot = createRoot(root);

reactRoot.render(
  <React.StrictMode>
    <TabStateContextProvider>
      <LayoverProvider>
        <Layover />
      </LayoverProvider>
    </TabStateContextProvider>
  </React.StrictMode>
);
