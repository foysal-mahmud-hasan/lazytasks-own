// src/App.js
import React, { Suspense }from 'react';
import AppRoutes from './Routes';
import FloatingActionButtons from './components/FloatingActionButtons';

const App = () => {
  return (
    <>
      <Suspense>
      <AppRoutes/>
      <div id="lazytasks-premium"></div>
      <div id="lazytask_premium_license_tab_panel"></div>
      <FloatingActionButtons/>       
      </Suspense>
    </>
  );
};

export default App;
