import React from 'react';
import { Outlet } from 'react-router-dom';
// Import any other components you need for your layout

function App() {
  return (
    <div className="app">
      {/* Your app header, navigation, etc. */}
      <main>
        <Outlet /> {/* This is where your route components will render */}
      </main>
      {/* Your app footer, if any */}
    </div>
  );
}

export default App;
