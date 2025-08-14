import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';

import { RetirementProvider } from './context/retirement-context';
import MainDashboard from './components/main-dashboard.js';
import theme from './theme';

function App() {
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
