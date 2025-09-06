import React, { useState } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Button, Stack, TextField, Card, CardContent, Typography, Drawer, IconButton, TableContainer, Table, TableRow, TableCell, TableBody, TableHead, Paper } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EditIcon from '@mui/icons-material/Edit';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line, Cell } from 'recharts';

const contribution_frequencies = [
  { value: 12, label: 'Monthly' },
  { value: 24, label: 'Bi-Monthly' },
  { value: 52, label: 'Weekly' },
  { value: 26, label: 'Bi-Weekly' }
];

export default function RetirementFundsInfo() {
  const { updateRetirementData, fetchRetirementData, retirementData, familyInfoData, loading, error, updateActualBalance } = useRetirement();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [returnRateDrawerOpen, setReturnRateDrawerOpen] = useState(false);
  const [returnRateParams, setReturnRateParams] = useState({});
  const [originalReturnRateParams, setOriginalReturnRateParams] = useState({});

  const getReturnRateParams = (index) => {
    const fund = retirementData?.retirement_fund_data?.[index];
    const params = returnRateParams[index] || fund?.['return_rate_params'] || [];
    return params;
  };
  const setReturnRateParamsForFund = (fundIndex, params) => {
    setReturnRateParams(prev => ({ ...prev, [fundIndex]: params }));
  };

  const [formStates, setFormStates] = useState({});
  const getFormData = (index) => formStates[index] || {};
  const setFormData = (index, data) => {
    setFormStates(prev => ({ ...prev, [index]: data }));
  };

  const handleCardClick = (index) => {
    setEditingFund(index);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    if (editingFund !== null && formStates[editingFund] && Object.keys(formStates[editingFund]).length > 0) {
      const updateData = {
        ...formStates[editingFund],
        'return_rate_params': getReturnRateParams(editingFund)
      };
      updateRetirementData(editingFund, updateData).then(() => {
        fetchRetirementData(); // Recalculate projections
        setFormStates(prev => {
          const newStates = { ...prev };
          delete newStates[editingFund];
          return newStates;
        });
      });
    }
    setDrawerOpen(false);
    setEditingFund(null);
  };

  const handleChange = (index) => (event) => {
    const { name, value } = event.target;
    setFormData(index, {
      ...getFormData(index),
      [name]: ['initial_investment', 'regular_contribution', 'contribution_frequency'].includes(name) 
        ? (name === 'contribution_frequency' ? parseInt(value) : parseFloat(value) || 0) 
        : value
    });
  };


  const deleteFund = async (index) => {
    await updateRetirementData(index, null);
    setFormStates(prev => {
      const newStates = {};
      Object.keys(prev).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex < index) {
          newStates[keyIndex] = prev[key];
        } else if (keyIndex > index) {
          newStates[keyIndex - 1] = prev[key];
        }
      });
      return newStates;
    });
    // Reset selectedFund if it's the deleted fund or beyond
    if (selectedFund >= index) {
      setSelectedFund(Math.max(0, selectedFund - 1));
    }
  };

  const handleAddFund = () => {
    const newIndex = retirementData?.retirement_fund_data?.length || 0;
    setSelectedFund(newIndex);
    setEditingFund(newIndex);
    setDrawerOpen(true);
    
    updateRetirementData(newIndex, {
      'id': crypto.randomUUID(),
      'name': 'New Fund',
      'family_member_id': familyInfoData?.family_info_data?.[0]?.id || '',
      'initial_investment': 1000,
      'regular_contribution': 10,
      'contribution_frequency': 12,
      'start_date': new Date().toISOString().split('T')[0],
      'return_rate_params': [],
      'actual_data': []
    }).then(() => {
      fetchRetirementData(); // Refresh to get projections
    });
  };

  const renderFundCards = () => {
    if (error) return null;
    
    const fundCards = retirementData?.retirement_fund_data?.length ? 
      retirementData.retirement_fund_data.map((fund, index) => {
        const member = familyInfoData?.family_info_data?.find(m => m.id === fund['family_member_id']);
        const latestProjection = fund.retirement_projection?.[fund.retirement_projection.length - 1];
        
        return (
          <Card 
            className="rounded-2xl shadow-md" 
            sx={{ 
              mb: 2, 
              width: 300,
              minWidth: 300,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#d4d4d4ff',
                transform: 'translateY(-2px)',
                boxShadow: 3
              },
              transition: 'all 0.2s ease-in-out'
            }} 
            key={index}
            onClick={() => setSelectedFund(index)}
          >
            <CardContent className="p-4">
              <Stack direction="row" spacing={1} alignItems="center">
                <AccountBalanceIcon/>
                <h3 className="text-sm">{fund.name}</h3>
              </Stack>
              <Stack direction="column" spacing={0.5} alignItems="left" className="mb-2">
                <p className="text-sm">Owner: {member?.name || 'Unknown'}</p>
                <p className="text-sm">Initial: ${fund['initial_investment']?.toLocaleString()}</p>
                <p className="text-sm">Monthly: ${fund['regular_contribution']}</p>
                {latestProjection && (
                  <p className="text-sm">Final Balance: ${latestProjection.end_amount?.toLocaleString()}</p>
                )}
              </Stack>
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(index);
                }}
                sx={{ mt: 1 }}
              >
                Edit
              </Button>
            </CardContent>
          </Card>
        );
      }) : [];

    const addFundCard = (
      <Card 
        className="rounded-2xl shadow-md" 
        sx={{ 
          mb: 2, 
          width: 300,
          minWidth: 300,
          cursor: 'pointer',
          border: '2px dashed #ccc',
          backgroundColor: '#f9f9f9',
          '&:hover': {
            backgroundColor: '#e8f5e8',
            border: '2px dashed #4caf50',
            transform: 'translateY(0px)',
            boxShadow: 3
          },
          transition: 'all 0.2s ease-in-out'
        }} 
        key="add-fund"
        onClick={handleAddFund}
      >
        <CardContent className="p-4">
          <Stack direction="column" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 120 }}>
            <AddIcon sx={{ fontSize: 40, color: '#666' }} />
            <Typography variant="h6" color="textSecondary">
              Add Fund
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );

    return [...fundCards, addFundCard];
  };

  const [selectedFund, setSelectedFund] = useState(0);
  const [actualInputs, setActualInputs] = useState({});
  const [actualsDrawerOpen, setActualsDrawerOpen] = useState(false);
  const [editingActuals, setEditingActuals] = useState(null);
  const [actualFormData, setActualFormData] = useState({});

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Funds */}
      <Box 
        sx={{ 
          display: 'flex', 
          overflowX: 'auto',
          gap: 2, 
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 12,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: 4,
          }
        }}
      >
        {renderFundCards()}
      </Box>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        hideBackdrop={false}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Edit Retirement Fund</Typography>
            <IconButton onClick={handleDrawerClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          {editingFund !== null && retirementData?.retirement_fund_data?.[editingFund] && (
            <Stack spacing={2}>
              <TextField 
                label="Name" 
                name="name"
                variant="outlined"
                fullWidth
                value={getFormData(editingFund)['name'] || retirementData.retirement_fund_data[editingFund]['name']}
                onChange={handleChange(editingFund)}
              />
              <TextField 
                label="Family Member"
                name="family_member_id"
                select
                variant="outlined"
                fullWidth
                value={getFormData(editingFund)['family_member_id'] || retirementData.retirement_fund_data[editingFund]['family_member_id']}
                onChange={handleChange(editingFund)}
              >
                {familyInfoData?.family_info_data?.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    {member.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Initial Investment"
                name="initial_investment"
                variant="outlined"
                fullWidth
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                value={getFormData(editingFund)['initial_investment'] || retirementData.retirement_fund_data[editingFund]['initial_investment']}
                onChange={handleChange(editingFund)}
              />
              <TextField
                label="Regular Contribution"
                name="regular_contribution"
                variant="outlined"
                fullWidth
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                value={getFormData(editingFund)['regular_contribution'] || retirementData.retirement_fund_data[editingFund]['regular_contribution']}
                onChange={handleChange(editingFund)}
              />
              <TextField
                label="Contribution Frequency"
                name="contribution_frequency"
                select
                variant="outlined"
                fullWidth
                value={getFormData(editingFund)['contribution_frequency'] || retirementData.retirement_fund_data[editingFund]['contribution_frequency']}
                onChange={handleChange(editingFund)}
              >
                {contribution_frequencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Start Date"
                name="start_date"
                variant="outlined"
                fullWidth
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={getFormData(editingFund)['start_date'] || retirementData.retirement_fund_data[editingFund]['start_date'] || ''}
                onChange={handleChange(editingFund)}
              />
              <Button 
                variant="outlined" 
                startIcon={<TuneIcon />}
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  const fund = retirementData?.retirement_fund_data?.[editingFund];
                  if (fund) {
                    const existingParams = fund['return_rate_params'] || [];
                    setReturnRateParamsForFund(editingFund, existingParams);
                    setOriginalReturnRateParams(prev => ({ ...prev, [editingFund]: JSON.parse(JSON.stringify(existingParams)) }));
                  }
                  setReturnRateDrawerOpen(true);
                }}
              >
                Return Rates
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                disabled={loading}
                fullWidth
                sx={{ mt: 1 }}
                onClick={() => {
                  deleteFund(editingFund);
                  setDrawerOpen(false);
                }}
              >
                {loading ? 'Deleting...' : 'Delete Fund'}
              </Button>
            </Stack>
          )}
        </Box>
      </Drawer>

      <Drawer
        anchor="right"
        open={returnRateDrawerOpen}
        onClose={() => {
          if (editingFund !== null) {
            const currentParams = getReturnRateParams(editingFund);
            const originalParams = originalReturnRateParams[editingFund] || [];
            
            // Only save if parameters have changed
            if (JSON.stringify(currentParams) !== JSON.stringify(originalParams)) {
              const updateData = {
                'return_rate_params': currentParams
              };
              updateRetirementData(editingFund, updateData).then(() => {
                fetchRetirementData();
              });
            }
          }
          setReturnRateDrawerOpen(false);
        }}
        sx={{ '& .MuiDrawer-paper': { width: 400, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Return Rate Parameters</Typography>
          <IconButton onClick={() => {
            if (editingFund !== null) {
              const currentParams = getReturnRateParams(editingFund);
              const originalParams = originalReturnRateParams[editingFund] || [];
              
              // Only save if parameters have changed
              if (JSON.stringify(currentParams) !== JSON.stringify(originalParams)) {
                const updateData = {
                  'return_rate_params': currentParams
                };
                updateRetirementData(editingFund, updateData).then(() => {
                  fetchRetirementData();
                });
              }
            }
            setReturnRateDrawerOpen(false);
          }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {editingFund !== null && getReturnRateParams(editingFund).map((param, paramIndex) => (
          <Paper key={paramIndex} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Stack spacing={1} direction={'row'} alignItems="center">
              <TextField
                label="From Age"
                type="number"
                size="small"
                variant="standard"
                sx={{ width: 100 }}
                slotProps={{ htmlInput: { min: 0, max: 150 } }}
                value={param.from_age || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(editingFund)];
                  params[paramIndex] = { ...params[paramIndex], from_age: parseInt(e.target.value) };
                  setReturnRateParamsForFund(editingFund, params);
                }}
              />
              <TextField
                label="To Age"
                type="number"
                size="small"
                variant="standard"
                sx={{ width: 100 }}
                slotProps={{ htmlInput: { min: 0, max: 150 } }}
                value={param.to_age || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(editingFund)];
                  params[paramIndex] = { ...params[paramIndex], to_age: parseInt(e.target.value) };
                  setReturnRateParamsForFund(editingFund, params);
                }}
              />
              <TextField
                label="Return Rate (%)"
                type="number"
                size="small"
                variant="standard"
                sx={{ width: 120 }}
                slotProps={{ htmlInput: { step: 0.1, min: 0, max: 100 } }}
                value={param.return_rate || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(editingFund)];
                  params[paramIndex] = { ...params[paramIndex], return_rate: parseFloat(e.target.value) };
                  setReturnRateParamsForFund(editingFund, params);
                }}
              />
            </Stack>
            <Button sx={{ mt: 2 }}
              variant="contained" 
              size="small"
              onClick={() => {
                const params = getReturnRateParams(editingFund).filter((_, i) => i !== paramIndex);
                setReturnRateParamsForFund(editingFund, params);
              }}
            >
              Remove
            </Button>
          </Paper>
        ))}
        
        <Button 
          variant="contained" 
          onClick={() => {
            if (editingFund !== null) {
              const params = [...getReturnRateParams(editingFund), { from_age: 25, to_age: 65, return_rate: 7.0 }];
              setReturnRateParamsForFund(editingFund, params);
            }
          }}
        >
          Add Return Rate Range
        </Button>
        

      </Drawer>

      {/* Actuals Input Drawer */}
      <Drawer
        anchor="right"
        open={actualsDrawerOpen}
        onClose={() => {
          if (editingActuals) {
            const currentContributions = actualFormData.actual_contributions || 0;
            const currentBalance = actualFormData.actual_balance || 0;
            const originalContributions = editingActuals.yearData.is_actual_balance ? editingActuals.yearData.contribution : 0;
            const originalBalance = editingActuals.yearData.is_actual_balance ? editingActuals.yearData.end_amount : 0;
            
            const hasChanges = currentContributions !== originalContributions || currentBalance !== originalBalance;
            
            if (hasChanges) {
              const fund = retirementData.retirement_fund_data[selectedFund];
              
              if (currentContributions > 0 || currentBalance > 0) {
                const beginAmount = editingActuals.yearData.begin_amount;
                const actualGrowth = currentBalance - beginAmount - currentContributions;
                updateActualBalance(fund.id, editingActuals.year, currentBalance, currentContributions, actualGrowth);
              } else {
                // Clear the entry if both fields are empty
                updateActualBalance(fund.id, editingActuals.year, null, null, null);
              }
            }
          }
          setActualsDrawerOpen(false);
          setActualFormData({});
        }}
        sx={{ '& .MuiDrawer-paper': { width: 400, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Actual Data - {editingActuals?.year}</Typography>
          <IconButton onClick={() => {
            const hasChanges = actualFormData.actual_contributions || actualFormData.actual_balance;
            if (hasChanges && editingActuals) {
              const fund = retirementData.retirement_fund_data[selectedFund];
              const actualContributions = actualFormData.actual_contributions || 0;
              const actualBalance = actualFormData.actual_balance || 0;
              const beginAmount = editingActuals.yearData.begin_amount;
              const actualGrowth = actualBalance - beginAmount - actualContributions;
              
              updateActualBalance(fund.id, editingActuals.year, actualBalance, actualContributions, actualGrowth);
            }
            setActualsDrawerOpen(false);
            setActualFormData({});
          }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        {editingActuals && (
          <Stack spacing={2}>
            <TextField
              label="Actual Contributions"
              type="number"
              variant="outlined"
              fullWidth
              value={actualFormData.actual_contributions || ''}
              onChange={(e) => setActualFormData(prev => ({ ...prev, actual_contributions: parseFloat(e.target.value) || 0 }))}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            <TextField
              label="Actual End Balance"
              type="number"
              variant="outlined"
              fullWidth
              value={actualFormData.actual_balance || ''}
              onChange={(e) => setActualFormData(prev => ({ ...prev, actual_balance: parseFloat(e.target.value) || 0 }))}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
            {editingActuals.yearData.is_actual_balance && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={() => {
                  const fund = retirementData.retirement_fund_data[selectedFund];
                  updateActualBalance(fund.id, editingActuals.year, null, null, null);
                  setActualsDrawerOpen(false);
                  setActualFormData({});
                }}
              >
                Clear Actuals
              </Button>
            )}
          </Stack>
        )}
      </Drawer>

      {/* Fund Projection Chart */}
        <Box
          sx={{ 
            display: 'flex', 
            overflowX: 'auto',
            gap: 2, 
            pb: 1,
          }}
        >
        <Card
          className="rounded-2xl shadow-md" 
          sx={{ 
            mb: 2, 
            width: "100%",
            transition: 'all 0.2s ease-in-out'
          }} 
        > 
          <CardContent className="p-4">
            <Typography variant="h6" sx={{ mb: 2 }}>Fund Projection - {retirementData.retirement_fund_data[selectedFund]?.name || 'Loading...'}</Typography>
            {retirementData.retirement_fund_data[selectedFund]?.retirement_projection && (() => {
              const fund = retirementData.retirement_fund_data[selectedFund];
              const member = familyInfoData?.family_info_data?.find(m => m.id === fund['family_member_id']);
              
              if (!member) return null;
              
              const currentAge = Math.floor((new Date() - new Date(member['date_of_birth'])) / (365.25 * 24 * 60 * 60 * 1000));
              const retirementYear = new Date().getFullYear() + (member['retirement_age'] - currentAge);
              
              const startYear = fund.start_date ? new Date(fund.start_date).getFullYear() : new Date().getFullYear();
              const filteredData = fund.retirement_projection.filter(data => data.year <= retirementYear && data.year >= startYear);
              
              // Calculate return rate change markers
              const returnRateParams = fund['return_rate_params'] || [];
              const returnRateMarkers = returnRateParams.map(param => {
                const changeYear = new Date().getFullYear() + (param.from_age - currentAge);
                return {
                  year: changeYear,
                  rate: param.return_rate,
                  age: param.from_age
                };
              }).filter(marker => marker.year <= retirementYear && marker.year >= startYear);
              const firstYear = filteredData.length > 0 ? filteredData[0].year : startYear;
              const firstReturnRateMarker = returnRateMarkers.find(marker => marker.year <= firstYear);
              const firstReturnRate = firstReturnRateMarker ? firstReturnRateMarker.rate : 7;
              const currentYear = new Date().getFullYear();
              
              
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={filteredData} margin={{ top: 40, right: 30, left: 35, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" interval={0} angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, 'Year End Balance']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return `Year: ${label} - Age: ${payload[0].payload.age}`;
                        }
                        return `Year: ${label}`;
                      }}
                    />
                    <Bar 
                      dataKey="end_amount"
                      animationEasing='ease'
                    >
                      {filteredData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.is_actual_balance ? '#ff4444' : '#778be7ff'} />
                      ))}
                    </Bar>
                    <ReferenceLine
                      x={startYear}
                      stroke="#ff9800"
                      strokeDasharray="5 5"
                      label={{ 
                        value: `${firstReturnRate}%`, 
                        position: "insideTopRight", 
                        offset: -15,
                        angle: 0,
                        fontStyle: 'italic',
                        fill: '#ff9800',
                        fontSize: '12'
                      }}
                    />
                    <ReferenceLine
                      x={currentYear}
                      stroke="#4caf50"
                      strokeWidth={3}
                      y1={0}
                      label={{ 
                        value: 'Current Year', 
                        position: "top", 
                        offset: 20,
                        angle: 0,
                        fontWeight: 'bold',
                        fill: '#4caf50',
                        fontSize: '12'
                      }}
                    />
                    {returnRateMarkers.map((marker, index) => (
                      <ReferenceLine
                        key={`rate-change-${index}`}
                        x={marker.year}
                        stroke="#ff9800"
                        strokeDasharray="5 5"
                        label={{ 
                          value: `${marker.rate}%`, 
                          position: "insideTopRight", 
                          offset: -15,
                          angle: 0,
                          fontStyle: 'italic',
                          fill: '#ff9800',
                          fontSize: '12'
                        }}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </Box>

      {/* Year by Year Table */}
      {retirementData?.retirement_fund_data?.[selectedFund] && (
        <Box
          sx={{ 
            display: 'flex', 
            overflowX: 'auto',
            gap: 2, 
            pb: 1,
          }}
        >
          <Card
            className="rounded-2xl shadow-md" 
            sx={{ 
              mb: 2, 
              width: "100%",
              transition: 'all 0.2s ease-in-out'
            }} 
          > 
            <CardContent className="p-4">
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid #e0e0e0' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="right">Year</TableCell>
                      <TableCell align="right">Age</TableCell>
                      <TableCell align="right">Return Rate</TableCell>
                      <TableCell align="right">Begin Amount</TableCell>
                      <TableCell align="right">Contributions</TableCell>
                      <TableCell align="right">Growth</TableCell>
                      <TableCell align="right">End Amount</TableCell>

                      <TableCell align="center">Actuals</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const fund = retirementData.retirement_fund_data[selectedFund];
                      const member = familyInfoData?.family_info_data?.find(m => m.id === fund['family_member_id']);
                      
                      if (!member) return null;
                      
                      const currentAge = Math.floor((new Date() - new Date(member['date_of_birth'])) / (365.25 * 24 * 60 * 60 * 1000));
                      const retirementYear = new Date().getFullYear() + (member['retirement_age'] - currentAge);
                      const startYear = fund.start_date ? new Date(fund.start_date).getFullYear() : new Date().getFullYear();
                      
                      return fund.retirement_projection?.filter(data => data.year <= retirementYear && data.year >= startYear).map((yearData, yearIndex, filteredArray) => {
                        const inputKey = `${selectedFund}-${yearData.year}`;
                        const hasActual = yearData.is_actual_balance;
                        const prevYearHasActual = yearIndex > 0 && filteredArray[yearIndex - 1].is_actual_balance;
                        
                        const currentYear = new Date().getFullYear();
                        const isCurrentYear = yearData.year === currentYear;
                        
                        return (
                          <TableRow key={yearIndex} sx={{ backgroundColor: isCurrentYear ? '#e8f5e8' : 'inherit' }}>
                            <TableCell align="right">{yearData.year}</TableCell>
                            <TableCell align="right">{yearData.age}</TableCell>
                            <TableCell align="right">{(yearData.annual_return_rate * 100).toFixed(2)}%</TableCell>
                            <TableCell align="right" sx={{ color: prevYearHasActual ? 'red' : 'inherit' }}>${yearData.begin_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell align="right" sx={{ color: hasActual ? 'red' : 'inherit' }}>${yearData.contribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell align="right" sx={{ color: hasActual ? 'red' : 'inherit' }}>${yearData.growth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                            <TableCell align="right" sx={{ color: hasActual ? 'red' : 'inherit' }}>${yearData.end_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>

                            <TableCell align="center">
                              <Button
                                size="small"
                                variant={hasActual ? "outlined" : "contained"}
                                onClick={() => {
                                  setEditingActuals({ fundIndex: selectedFund, year: yearData.year, yearData });
                                  setActualFormData({
                                    actual_contributions: hasActual ? yearData.contribution : '',
                                    actual_balance: hasActual ? yearData.end_amount : ''
                                  });
                                  setActualsDrawerOpen(true);
                                }}
                              >
                                {hasActual ? 'Update' : 'Add'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}
    </div>
  );
}