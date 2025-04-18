import React from 'react';
import './css/app.css';
import Home from './components/home';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>React Flask Docker Template</h1>
        <Home />
      </header>
    </div>
  );
}

export default App;
