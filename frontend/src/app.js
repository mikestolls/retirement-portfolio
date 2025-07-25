import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

import { RetirementProvider } from './context/retirement-context';
import MainDashboard from './components/main-dashboard.js';
import InputData from './components/input-data.js';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#388e3c',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RetirementProvider>
          <div className="App">
            <Routes>
              <Route path="/*" element={<MainDashboard />} />
            </Routes>
          </div>
        </RetirementProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
