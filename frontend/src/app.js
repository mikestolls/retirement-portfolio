import React from 'react';
import './css/app.css';
import YearByYearTable from './components/year-by-year-table';
import YearByYearChart from './components/year-by-year-chart';
import InputData from './components/input-data';
import { RetirementProvider } from './context/retirement-context';

function App() {
  return (
    <RetirementProvider>
      <div className="App">
        <InputData />
        <YearByYearChart />
        <YearByYearTable />
      </div>
    </RetirementProvider>
  );
}

export default App;
