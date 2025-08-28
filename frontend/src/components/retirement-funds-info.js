import React, { useState, useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Button, Stack, TextField, Card, CardContent, Typography, Drawer, IconButton, TableContainer, Table, TableRow, TableCell, TableBody, TableHead, Paper } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EditIcon from '@mui/icons-material/Edit';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const contribution_frequencies = [
  { value: 12, label: 'Monthly' },
  { value: 24, label: 'Bi-Monthly' },
  { value: 52, label: 'Weekly' },
  { value: 26, label: 'Bi-Weekly' }
];

export default function RetirementFundsInfo() {
  const { updateRetirementFundInfoData, fetchRetirementFundInfoData, retirementFundInfoData, fetchFamilyInfoData, familyInfoData, loading, error } = useRetirement();

  useEffect(() => {
    fetchRetirementFundInfoData();
    fetchFamilyInfoData();
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [returnRateDrawerOpen, setReturnRateDrawerOpen] = useState(false);
  const [returnRateParams, setReturnRateParams] = useState({});
  const [originalReturnRateParams, setOriginalReturnRateParams] = useState({});

  const getReturnRateParams = (index) => {
    const fund = retirementFundInfoData?.retirement_fund_data?.[index];
    const params = returnRateParams[index] || fund?.['return-rate-params'] || [];
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
        'return-rate-params': getReturnRateParams(editingFund)
      };
      updateRetirementFundInfoData(editingFund, updateData).then(() => {
        fetchRetirementFundInfoData(); // Recalculate projections
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
      [name]: ['initial-investment', 'regular-contribution', 'contribution-frequency'].includes(name) 
        ? (name === 'contribution-frequency' ? parseInt(value) : parseFloat(value) || 0) 
        : value
    });
  };


  const deleteFund = async (index) => {
    await updateRetirementFundInfoData(index, null);
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
    const newIndex = retirementFundInfoData?.retirement_fund_data?.length || 0;
    setSelectedFund(newIndex);
    setEditingFund(newIndex);
    setDrawerOpen(true);
    
    updateRetirementFundInfoData(newIndex, {
      'name': 'New Fund',
      'family-member-id': familyInfoData?.family_info_data?.[0]?.id || '',
      'initial-investment': 1000,
      'regular-contribution': 10,
      'contribution-frequency': 12
    }).then(() => {
      fetchRetirementFundInfoData(); // Refresh to get projections
    });
  };

  const renderFundCards = () => {
    if (error) return null;
    
    const fundCards = retirementFundInfoData?.retirement_fund_data?.length ? 
      retirementFundInfoData.retirement_fund_data.map((fund, index) => {
        const member = familyInfoData?.family_info_data?.find(m => m.id === fund['family-member-id']);
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
                <p className="text-sm">Initial: ${fund['initial-investment']?.toLocaleString()}</p>
                <p className="text-sm">Monthly: ${fund['regular-contribution']}</p>
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
          {editingFund !== null && retirementFundInfoData?.retirement_fund_data?.[editingFund] && (
            <Stack spacing={2}>
              <TextField 
                label="Name" 
                name="name"
                variant="outlined"
                fullWidth
                value={getFormData(editingFund)['name'] || retirementFundInfoData.retirement_fund_data[editingFund]['name']}
                onChange={handleChange(editingFund)}
              />
              <TextField 
                label="Family Member"
                name="family-member-id"
                select
                variant="outlined"
                fullWidth
                value={getFormData(editingFund)['family-member-id'] || retirementFundInfoData.retirement_fund_data[editingFund]['family-member-id']}
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
                name="initial-investment"
                variant="outlined"
                fullWidth
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                value={getFormData(editingFund)['initial-investment'] || retirementFundInfoData.retirement_fund_data[editingFund]['initial-investment']}
                onChange={handleChange(editingFund)}
              />
              <TextField
                label="Regular Contribution"
                name="regular-contribution"
                variant="outlined"
                fullWidth
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
                value={getFormData(editingFund)['regular-contribution'] || retirementFundInfoData.retirement_fund_data[editingFund]['regular-contribution']}
                onChange={handleChange(editingFund)}
              />
              <TextField
                label="Contribution Frequency"
                name="contribution-frequency"
                select
                variant="outlined"
                fullWidth
                value={getFormData(editingFund)['contribution-frequency'] || retirementFundInfoData.retirement_fund_data[editingFund]['contribution-frequency']}
                onChange={handleChange(editingFund)}
              >
                {contribution_frequencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button 
                variant="outlined" 
                startIcon={<TuneIcon />}
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  const fund = retirementFundInfoData?.retirement_fund_data?.[editingFund];
                  if (fund) {
                    const existingParams = fund['return-rate-params'] || [];
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
                'return-rate-params': currentParams
              };
              updateRetirementFundInfoData(editingFund, updateData).then(() => {
                fetchRetirementFundInfoData();
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
                  'return-rate-params': currentParams
                };
                updateRetirementFundInfoData(editingFund, updateData).then(() => {
                  fetchRetirementFundInfoData();
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
                value={param.fromAge || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(editingFund)];
                  params[paramIndex] = { ...params[paramIndex], fromAge: parseInt(e.target.value) };
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
                value={param.toAge || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(editingFund)];
                  params[paramIndex] = { ...params[paramIndex], toAge: parseInt(e.target.value) };
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
                value={param.returnRate || ''}
                onChange={(e) => {
                  const params = [...getReturnRateParams(editingFund)];
                  params[paramIndex] = { ...params[paramIndex], returnRate: parseFloat(e.target.value) };
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
              const params = [...getReturnRateParams(editingFund), { fromAge: 25, toAge: 65, returnRate: 7.0 }];
              setReturnRateParamsForFund(editingFund, params);
            }
          }}
        >
          Add Return Rate Range
        </Button>
        

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
            <Typography variant="h6" sx={{ mb: 2 }}>Fund Projection - {retirementFundInfoData.retirement_fund_data[selectedFund]?.name || 'Loading...'}</Typography>
            {retirementFundInfoData.retirement_fund_data[selectedFund]?.retirement_projection && (() => {
              const fund = retirementFundInfoData.retirement_fund_data[selectedFund];
              const member = familyInfoData?.family_info_data?.find(m => m.id === fund['family-member-id']);
              
              if (!member) return null;
              
              const currentAge = Math.floor((new Date() - new Date(member['date-of-birth'])) / (365.25 * 24 * 60 * 60 * 1000));
              const retirementYear = new Date().getFullYear() + (member['retirement-age'] - currentAge);
              
              const filteredData = fund.retirement_projection.filter(data => data.year <= retirementYear);
              
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
                    <Bar dataKey="end_amount" fill="#778be7ff" />
                  </BarChart>
                </ResponsiveContainer>
              );
            })()}
          </CardContent>
        </Card>
      </Box>

      {/* Year by Year Table */}
      {retirementFundInfoData?.retirement_fund_data?.[selectedFund] && (
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
              <Typography variant="h6" sx={{ mb: 2 }}>Year by Year Projection - {retirementFundInfoData.retirement_fund_data[selectedFund]?.name || 'Loading...'}</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell align="right">Year</TableCell>
                      <TableCell align="right">Age</TableCell>
                      <TableCell align="right">Return Rate</TableCell>
                      <TableCell align="right">Begin Amount</TableCell>
                      <TableCell align="right">Contributions</TableCell>
                      <TableCell align="right">Growth</TableCell>
                      <TableCell align="right">End Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const fund = retirementFundInfoData.retirement_fund_data[selectedFund];
                      const member = familyInfoData?.family_info_data?.find(m => m.id === fund['family-member-id']);
                      
                      if (!member) return null;
                      
                      const currentAge = Math.floor((new Date() - new Date(member['date-of-birth'])) / (365.25 * 24 * 60 * 60 * 1000));
                      const retirementYear = new Date().getFullYear() + (member['retirement-age'] - currentAge);
                      
                      return fund.retirement_projection?.filter(data => data.year <= retirementYear).map((yearData, yearIndex) => (
                        <TableRow key={yearIndex}>
                          <TableCell align="right">{yearData.year}</TableCell>
                          <TableCell align="right">{yearData.age}</TableCell>
                          <TableCell align="right">{(yearData.annual_return_rate * 100).toFixed(2)}%</TableCell>
                          <TableCell align="right">${yearData.begin_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right">${yearData.contribution.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right">${yearData.growth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell align="right">${yearData.end_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ));
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