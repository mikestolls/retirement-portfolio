import React, { useState } from 'react';
import { 
  Typography, Grid, TextField, Button, Paper, Box, 
  Divider, IconButton, MenuItem, Select, InputLabel,
  FormControl, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRetirement } from '../context/retirement-context';

export default function Accounts() {
  const { retirementData, loading, error } = useRetirement();
  
  // Use the data from context
  const yearByYearData  = retirementData?.retirement_data || [];
  
  const [accounts, setAccounts] = useState([
    { 
      name: '401(k)', 
      type: 'retirement', 
      balance: 50000, 
      annualContribution: 6000,
      contributionFrequency: 26,
      expectedReturn: 7
    }
  ]);
  
  const handleAccountChange = (index, field, value) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[index] = {
      ...updatedAccounts[index],
      [field]: value
    };
    setAccounts(updatedAccounts);
  };
  
  const addAccount = () => {
    setAccounts([
      ...accounts,
      { 
        name: '', 
        type: 'retirement', 
        balance: 0, 
        annualContribution: 0,
        contributionFrequency: 12,
        expectedReturn: 5
      }
    ]);
  };
  
  const removeAccount = (index) => {
    const updatedAccounts = [...accounts];
    updatedAccounts.splice(index, 1);
    setAccounts(updatedAccounts);
  };
  
  const handleSubmit = () => {
    updateAccountsInfo(accounts);
  };
  
  const accountTypes = [
    { value: 'retirement', label: 'Retirement (401k, IRA)' },
    { value: 'brokerage', label: 'Brokerage Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'pension', label: 'Pension' },
    { value: 'other', label: 'Other' }
  ];
  
  const frequencies = [
    { value: 12, label: 'Monthly' },
    { value: 24, label: 'Bi-Monthly' },
    { value: 26, label: 'Bi-Weekly' },
    { value: 52, label: 'Weekly' },
    { value: 1, label: 'Annually' }
  ];
  
   return (
    <Box>
      <Typography variant="h5" gutterBottom>Retirement Dashboard</Typography>
      {loading ? (
        <Typography>Loading your retirement projections...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : yearByYearData.length === 0 ? (
        <Box textAlign="center" py={5}>
          <Typography variant="h6" gutterBottom>Welcome to Your Retirement Planner</Typography>
          <Typography paragraph>
            To get started, please enter your family information and account details.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Current Age
                  </Typography>
                  <Typography variant="h4">
                    {currentAge}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {yearsToRetirement} years until retirement
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Current Balance
                  </Typography>
                  <Typography variant="h4">
                    ${currentBalance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total across all accounts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Projected at Retirement
                  </Typography>
                  <Typography variant="h4">
                    ${projectedRetirementBalance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    At age {retirementAge}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Monthly Income
                  </Typography>
                  <Typography variant="h4">
                    ${monthlyRetirementIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estimated in retirement
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Retirement Balance Projection</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <AreaChart
                xAxis={[{ 
                  data: ages,
                  label: 'Age',
                  scaleType: 'linear'
                }]}
                yAxis={[{
                  label: 'Balance ($)',
                  valueFormatter: (value) => `$${value.toLocaleString(undefined, { notation: 'compact', compactDisplay: 'short' })}`
                }]}
                series={[
                  {
                    data: balances,
                    area: true,
                    label: 'Portfolio Balance',
                    valueFormatter: formatCurrency,
                    color: '#8884d8',
                    showMark: false
                  }
                ]}
                tooltip={{ trigger: 'axis' }}
                height={300}
              >
                <AreaPlot />
                <ChartsTooltip />
                <ChartsLegend />
              </AreaChart>
            </Box>
          </Paper>
          
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Contributions & Growth</Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <LineChart
                xAxis={[{ 
                  data: ages,
                  label: 'Age',
                  scaleType: 'linear'
                }]}
                yAxis={[{
                  label: 'Amount ($)',
                  valueFormatter: (value) => `$${value.toLocaleString(undefined, { notation: 'compact', compactDisplay: 'short' })}`
                }]}
                series={[
                  {
                    data: contributions,
                    label: 'Annual Contribution',
                    valueFormatter: formatCurrency,
                    color: '#82ca9d',
                    showMark: false
                  },
                  {
                    data: growthValues,
                    label: 'Annual Growth',
                    valueFormatter: formatCurrency,
                    color: '#ff7300',
                    showMark: false
                  }
                ]}
                tooltip={{ trigger: 'axis' }}
                height={300}
              >
                <LinePlot />
                <ChartsTooltip />
                <ChartsLegend />
              </LineChart>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}
