import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Tabs, Tab, Button, Stack, Divider, TextField, TableContainer, Table, TableRow, TableCell, TableBody, TableHead, Paper, Typography, Drawer, IconButton } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';

import { BarChart } from '@mui/x-charts/BarChart';

const contribution_frequencies = [
  {
    value: 12,
    label: 'Monthly',
  },
  {
    value: 24,
    label: 'Bi-Monthly',
  },
  {
    value: 52,
    label: 'Weekly',
  },
  {
    value: 26,
    label: 'Bi-Weekly',
  }
];

function RetirementFundsTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

RetirementFundsTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function tabProperty(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

export default function RetirementFundsInfo() {
  // Use the shared context
  const { updateRetirementFundInfoData, fetchRetirementFundInfoData, retirementFundInfoData, fetchFamilyInfoData, familyInfoData, loading, error } = useRetirement();

  // fetch on mount from backend
  useEffect(() => { 
    fetchRetirementFundInfoData();
    fetchFamilyInfoData();
  }, []);

  // handling tab changes
  const [activeTab, setActiveTab] = React.useState(0);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Form state management
  const [formStates, setFormStates] = useState({});
  const getFormData = (index) => formStates[index] || {};
  const setFormData = (index, data) => {
    setFormStates(prev => ({ ...prev, [index]: data }));
  };

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [returnRateParams, setReturnRateParams] = useState({});
  
  const getReturnRateParams = (index) => {
    const params = returnRateParams[index] || fund?.['return-rate-params'] || [];
    return params;
  };
  const setReturnRateParamsForFund = (fundIndex, params) => {
    setReturnRateParams(prev => ({ ...prev, [fundIndex]: params }));
  };
  
  // Initialize return rate params when drawer opens
  const handleDrawerOpen = (fundIndex) => {
    const fund = retirementFundInfoData?.retirement_fund_data?.[fundIndex];
    if (fund && !returnRateParams[fundIndex]) {
      const existingParams = fund['return-rate-params'] || [];
      setReturnRateParamsForFund(fundIndex, existingParams);
    }
    setDrawerOpen(fundIndex);
  };

  async function handleSubmit(event, index) {
    event.preventDefault();
    
    // Include return rate parameters in the update
    const updateData = {
      ...formStates[index],
      'return-rate-params': getReturnRateParams(index)
    };
    
    const success = await updateRetirementFundInfoData(index, updateData);
    if (success) {
      setFormData({}); // Clear form after successful update
      await fetchRetirementFundInfoData(); // Refresh data with new projections
    }
  }
  
  const handleChange = (index) => (event) => {
    const { name, value } = event.target;
    setFormData(index, {
      ...getFormData(index),
      [name]: value
    });
  };

  const deleteFund = async (index) => {
    await updateRetirementFundInfoData(index, null); // Delete member
    
    // Clean up form states - remove deleted index and shift remaining
    setFormStates(prev => {
      const newStates = {};
      Object.keys(prev).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          // Keep states before deleted index
          newStates[keyIndex] = prev[key];
        } else if (keyIndex > index) {
          // Shift states after deleted index down by 1
          newStates[keyIndex - 1] = prev[key];
        }
        // Skip the deleted index
      });

      // If deleting the last member and it's the active tab, shift left
      if (index === retirementFundInfoData?.retirement_fund_data?.length - 1 && activeTab === index) {
        setActiveTab(Math.max(0, index - 1));
      }
      
      return newStates;
    });
  };

  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='Retirement Fund Tabs'>
            {retirementFundInfoData?.retirement_fund_data?.map((member, index) => (
              <Tab
                key={index}
                label={member.name}
                {...tabProperty(0)}
              />
            ))}
            <Tab label="Add Fund" {...tabProperty(retirementFundInfoData?.retirement_fund_data?.length || 0)} onClick={() => 
              updateRetirementFundInfoData(retirementFundInfoData?.retirement_fund_data?.length, { 
                'name': 'Fund',
                'family-member-id': familyInfoData?.family_info_data?.[0]?.id || '',
                'initial-investment': 1000,
                'regular-contribution': 10,
                'contribution-frequency': 12,
                'return-rate-params': []
              })}/>
          </Tabs>
      </Box>
      {retirementFundInfoData?.retirement_fund_data?.map((fund, index) => (
        <RetirementFundsTabPanel key={index} value={activeTab} index={index}>
          <div>
            <form onSubmit={(e) => handleSubmit(e, index)}>
              <Paper elevation={2} sx={{ p: 1, backgroundColor: '#f5f5f5' }}>
                <Stack direction="row" spacing={1}>
                  <TextField 
                    sx={{ minWidth: 150 }}
                    label="Name" 
                    name="name"
                    variant="standard"
                    required
                    value={getFormData(index)['name'] || fund['name']}
                    onChange={handleChange(index)}/>
                  <TextField 
                    sx={{ minWidth: 150 }}
                    label="Family Member"
                    name="family-member-id"
                    select
                    variant="standard"
                    align="left"
                    required
                    value={getFormData(index)['family-member-id'] || fund['family-member-id'] || ''}
                    onChange={handleChange(index)}>
                    {familyInfoData?.family_info_data?.map((member, memberIndex) => {
                      const memberId = member.id
                      return (
                        <MenuItem key={memberId} value={memberId}>
                            {member.name}
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Stack>    
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <TextField 
                    sx={{ minWidth: 150 }}
                    label="Initial Investment" 
                    name="initial-investment"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    value={getFormData(index)['initial-investment'] || fund['initial-investment']}
                    onChange={handleChange(index)}/>
                  <TextField
                    sx={{ minWidth: 150 }}
                    label="Regular Contribution"
                    name="regular-contribution"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    value={getFormData(index)['regular-contribution'] || fund['regular-contribution']}
                    onChange={handleChange(index)}/>
                  <TextField 
                    sx={{ minWidth: 150 }}
                    label="Frequency"
                    name="contribution-frequency"
                    select
                    variant="standard"
                    align="left"
                    required
                    value={getFormData(index)['contribution-frequency'] || fund['contribution-frequency'] || 12}
                    onChange={handleChange(index)}>
                    {contribution_frequencies.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                  </TextField>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button type="submit" variant="contained" disabled={loading}>
                      {loading ? 'Updating...' : 'Update'}
                  </Button>
                  <Button variant="contained" disabled={loading} onClick={() => deleteFund(index)}>
                      {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                  <Button variant="outlined" onClick={() => handleDrawerOpen(index)} startIcon={<TuneIcon />}>
                      Return Rates
                  </Button>
                </Stack>
              </Paper>
            </form>
            <Paper elevation={2} sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5' }}>
              <TableContainer component={'div'} sx={{ maxHeight: 200 }}>
                <Table stickyHeader sx={{ minWidth: 650 }} size='small' aria-label="retirement projection table" >
                  <TableHead>
                    <TableRow>                      
                      <TableCell align='right'>Year</TableCell>
                      <TableCell align='right'>Age</TableCell>     
                      <TableCell align='right'>Annual Return Rate</TableCell>     
                      <TableCell align='right'>Begin Amount</TableCell>           
                      <TableCell align='right'>Contributions</TableCell>    
                      <TableCell align='right'>Growth</TableCell>
                      <TableCell align='right'>Withdrawal</TableCell>
                      <TableCell align='right'>End Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fund.retirement_projection && fund.retirement_projection.map((yearData, yearIndex) => (
                      <TableRow key={yearIndex}>
                        <TableCell align='right'>{yearData.year}</TableCell>
                        <TableCell align='right'>{yearData.age}</TableCell>
                        <TableCell align='right'>{(yearData.annual_return_rate * 100).toFixed(2)}%</TableCell>
                        <TableCell align='right'>${yearData.begin_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align='right'>${yearData.contribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align='right'>${yearData.growth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align='right'>${yearData.withdrawal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align='right'>${yearData.end_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            <Paper elevation={2} sx={{ mt: 2, p: 1, minHeight: 300, backgroundColor: '#f5f5f5' }}>
              {fund.retirement_projection && (
                <BarChart
                  hideLegend={true}
                  dataset={fund.retirement_projection}
                  xAxis={[{ label: 'Year', scaleType: 'band', dataKey: 'year', valueFormatter: (value) => value.toString() , tickPlacement: 'middle' }]}
                  yAxis={[{ label: 'Amount ($)', dataKey: 'end_amount' }]}
                  grid={{ horizontal: true }}
                  series={[
                    { dataKey: 'end_amount', label: 'Year End Balance', color: '#778be7ff' },
                  ]}
                  height={300}
                />
              )}
            </Paper>
          </div>
        </RetirementFundsTabPanel>
      ))}
      
      <Drawer
        anchor="right"
        open={drawerOpen !== false}
        onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 400, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Return Rate Parameters</Typography>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {drawerOpen !== false && getReturnRateParams(drawerOpen).map((param, paramIndex) => (
          <Paper key={paramIndex} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Stack spacing={1} direction={'row'} alignItems="center">
              <TextField
                label="From Age"
                type="number"
                size="small"
                variant="standard"
                sx={{ width: 100 }}
                slotProps={{ htmlInput: { min: 0, max: 150 } }}
                value={param.fromAge || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(drawerOpen)];
                  params[paramIndex] = { ...params[paramIndex], fromAge: parseInt(e.target.value) };
                  setReturnRateParamsForFund(drawerOpen, params);
                }}
              />
              <TextField
                label="To Age"
                type="number"
                size="small"
                variant="standard"
                sx={{ width: 100 }}
                slotProps={{ htmlInput: { min: 0, max: 150 } }}
                value={param.toAge || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(drawerOpen)];
                  params[paramIndex] = { ...params[paramIndex], toAge: parseInt(e.target.value) };
                  setReturnRateParamsForFund(drawerOpen, params);
                }}
              />
              <TextField
                label="Return Rate (%)"
                type="number"
                size="small"
                variant="standard"
                sx={{ width: 120 }}
                slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                value={param.returnRate || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(drawerOpen)];
                  params[paramIndex] = { ...params[paramIndex], returnRate: parseFloat(e.target.value) };
                  setReturnRateParamsForFund(drawerOpen, params);
                }}
              />
            </Stack>
            <Button sx={{ mt: 2 }}
              variant="contained" 
              size="small"
              onClick={() => {
                const params = getReturnRateParams(drawerOpen).filter((_, i) => i !== paramIndex);
                setReturnRateParamsForFund(drawerOpen, params);
              }}
            >
              Remove
            </Button>
          </Paper>
        ))}
        
        <Button 
          variant="contained" 
          onClick={() => {
            if (drawerOpen !== false) {
              const params = [...getReturnRateParams(drawerOpen), { fromAge: 25, toAge: 65, returnRate: 7.0 }];
              setReturnRateParamsForFund(drawerOpen, params);
            }
          }}
        >
          Add Return Rate Range
        </Button>
      </Drawer>
    </div>
  );
}