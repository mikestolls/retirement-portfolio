import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline
} from '@mui/material';

import { RetirementProvider } from './context/retirement-context';
import MainDashboard from './components/main-dashboard.js';

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <div className="App">
          <RetirementProvider>
            <MainDashboard>

            </MainDashboard>
          </RetirementProvider>
        </div>
    </ThemeProvider>
  );
}

export default App;
