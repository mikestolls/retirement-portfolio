import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Tabs, Tab, Button, Stack, Paper, TextField } from '@mui/material';
import PropTypes from 'prop-types';

function FamilyTabPanel(props) {
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

FamilyTabPanel.propTypes = {
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

export default function FamilyInfo() {
  // Use the shared context
  const { updateFamilyInfoData, fetchFamilyInfoData, familyInfoData, loading, error } = useRetirement();

  // fetch on mount from backend
  useEffect(() => { 
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

  async function handleSubmit(event, index) {
    event.preventDefault();
    
    // Update the specific member in the context
    await updateFamilyInfoData(index, formStates[index]);
    setFormData({}); // Clear form after successful update
  }
  
  const handleChange = (index) => (event) => {
    const { name, value } = event.target;
    setFormData(index, {
      ...getFormData(index),
      [name]: name === 'age' ? parseInt(value) || 0 : value
    });
  };

  const deleteMember = async (index) => {
    await updateFamilyInfoData(index, null); // Delete member
    
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
      if (index === familyInfoData?.family_info_data?.length - 1 && activeTab === index) {
        setActiveTab(Math.max(0, index - 1));
      }
      
      return newStates;
    });
  };

  return (
    <div>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='Family Info Tabs'>
            {familyInfoData?.family_info_data?.map((member, index) => (
              <Tab
                key={index}
                label={member.name}
                {...tabProperty(0)}
              />
            ))}
            <Tab label="Add Member" {...tabProperty(familyInfoData?.family_info_data?.length || 0)} onClick={() => 
              updateFamilyInfoData(familyInfoData?.family_info_data?.length, {
                'id': crypto.randomUUID(),
                'name': 'New Member',
                'age': 18,
                'life-expectancy': 90,
                'retirement-age': 65,
                'retirement-withdrawal': 4,
                'retirement-inflation': 2,
              })}/>
          </Tabs>
      </Box>
      {familyInfoData?.family_info_data?.map((member, index) => (
        <FamilyTabPanel key={index} value={activeTab} index={index}>
          <div>
            <form onSubmit={(e) => handleSubmit(e, index)}>
              <Paper elevation={2} sx={{ p: 1, backgroundColor: '#f5f5f5' }}>
                <Stack spacing={1}>
                  <TextField 
                    label="Name" 
                    name="name"
                    variant="standard"
                    required
                    value={getFormData(index)['name'] || member['name']}
                    onChange={handleChange(index)}/>
                  <TextField
                    label="Age"
                    name="age"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 150 } }}
                    value={getFormData(index)['age'] || member['age']}
                    onChange={handleChange(index)}/>
                  <TextField
                    label="Retirement Age"
                    name="retirement-age"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 150 } }}
                    value={getFormData(index)['retirement-age'] || member['retirement-age']}
                    onChange={handleChange(index)}/>
                  <TextField
                    label="Life Expectancy"
                    name="life-expectancy"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 150 } }}
                    value={getFormData(index)['life-expectancy'] || member['life-expectancy']}
                    onChange={handleChange(index)}/>
                  <TextField
                    label="Retirement Withdrawal (%)"
                    name="retirement-withdrawal"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 20, step: 0.1 } }}
                    value={getFormData(index)['retirement-withdrawal'] || member['retirement-withdrawal']}
                    onChange={handleChange(index)}/>
                  <TextField
                    label="Retirement Inflation (%)"
                    name="retirement-inflation"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 20, step: 0.1 } }}
                    value={getFormData(index)['retirement-inflation'] || member['retirement-inflation']}
                    onChange={handleChange(index)}/>
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button type="submit" variant="contained" disabled={loading}>
                      {loading ? 'Updating...' : 'Update'}
                  </Button>
                  <Button variant="contained" disabled={loading} onClick={() => deleteMember(index)}>
                      {loading ? 'Deleting...' : 'Delete'}
                  </Button>
                </Stack>
              </Paper>
            </form>
          </div>
        </FamilyTabPanel>
      ))}
    </div>
  );
}