import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Tabs, Tab, Button, Stack, TextField } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';

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
  const { updateRetirementFundInfoData, retirementFundInfoData, loading, error } = useRetirement();

  const [activeTab, setActiveTab] = React.useState(0);
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const [formStates, setFormStates] = useState({});

  const getFormData = (index) => formStates[index] || {};
  const setFormData = (index, data) => {
    setFormStates(prev => ({ ...prev, [index]: data }));
  };

  async function handleSubmit(event, index) {
    event.preventDefault();
    
    // Update the specific member in the context
    await updateRetirementFundInfoData(index, formStates[index]);
    setFormData({}); // Clear form after successful update
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
      if (index === familyInfoData?.familyinfo_data?.length - 1 && activeTab === index) {
        setActiveTab(Math.max(0, index - 1));
      }
      
      return newStates;
    });
  };

  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='Retirement Fund Tabs'>
            {retirementFundInfoData?.retirementfund_data?.map((member, index) => (
              <Tab
                key={index}
                label={member.name}
                {...tabProperty(0)}
              />
            ))}
            <Tab label="Add Fund" {...tabProperty(retirementFundInfoData?.retirementfund_data?.length || 0)} onClick={() => 
              updateRetirementFundInfoData(retirementFundInfoData?.retirementfund_data?.length, { 
                'name': 'Fund',
                'initial-investment': 1000,
                'regular-contribution': 10,
                'contribution-frequency': 12,
                'age': 18,
                'retirement-age': 65,
                'retirement-withdrawal': 4,
                'retirement-inflation': 2,
              })}/>
          </Tabs>
      </Box>
      {retirementFundInfoData?.retirementfund_data?.map((fund, index) => (
        <RetirementFundsTabPanel key={index} value={activeTab} index={index}>
          <div>
            <form onSubmit={(e) => handleSubmit(e, index)}>
            <Stack spacing={2}>
              <TextField 
                label="Initial Investment" 
                name="initial-investment"
                variant="standard"
                required
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                value={getFormData(index).initial_investment || fund.initial_investment}
                onChange={handleChange(index)}/>
              <TextField
                label="Regular Contribution"
                name="regular-contribution"
                variant="standard"
                required
                type="number"
                slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                value={getFormData(index).regular_contribution || fund.regular_contribution}
                onChange={handleChange(index)}/>
              <TextField 
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
              <TextField
                label="Retirement Age"
                name="retirement-age"
                variant="standard"
                required
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
                value={getFormData(index).retirement_age || fund.retirement_age}
                onChange={handleChange(index)}/>
              <TextField
                label="Retirement Withdrawal %"
                name="retirement-withdrawal"
                variant="standard"
                required
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }}
                value={getFormData(index).retirement_withdrawal || fund.retirement_withdrawal}
                onChange={handleChange(index)}/>
              <TextField
                label="Retirement Inflation %"
                name="retirement-inflation"
                variant="standard"
                required
                type="number"
                slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }}
                value={getFormData(index).retirement_inflation || fund.retirement_inflation}
                onChange={handleChange(index)}/>
            </Stack>
            <p/>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Updating...' : 'Update'}
              </Button>
              <Button variant="contained" disabled={loading} onClick={() => deleteFund(index)}>
                  {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </Stack>
            </form>
          </div>
        </RetirementFundsTabPanel>
      ))}
    </div>
  );
}