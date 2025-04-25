import React from 'react';
import './css/app.css';
import Home from './components/home';
import TestButton from './components/test-button';
import YearByYearTable from './components/year-by-year-table';
import InputData from './components/input-data';

function App() {
  return (
    <div className="App">
      <InputData />
      <YearByYearTable />
    </div>
  );
}

export default App;
