import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Tabs, Tab, Button, Stack, Paper, TextField, Card, CardContent, LinearProgress, Divider, Drawer, IconButton, Typography } from '@mui/material';

// icons
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

export default function FamilyInfo() {
  // Use the shared context
  const { updateFamilyInfoData, fetchFamilyInfoData, familyInfoData, loading, error } = useRetirement();

  // fetch on mount from backend
  useEffect(() => { 
    fetchFamilyInfoData(); 
  }, []);

  // handling card click to edit a member
  const [selectedMember, setSelectedMember] = useState(null);
  const handleCardClick = (index) => {
    setEditingMember(index);
    setDrawerOpen(true);
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const handleDrawerClose = async () => {
    // Only update if there are changes in formStates for this member
    if (editingMember !== null && formStates[editingMember] && Object.keys(formStates[editingMember]).length > 0) {
      await updateFamilyInfoData(editingMember, formStates[editingMember]);
      // Clear the form state after successful update
      setFormStates(prev => {
        const newStates = { ...prev };
        delete newStates[editingMember];
        return newStates;
      });
    }

    setDrawerOpen(false);
    setEditingMember(null);
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
      [name]: ['retirement-age', 'life-expectancy'].includes(name) ? parseInt(value) || 0 : value
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
      
      return newStates;
    });
  };

  const handleAddMember = () => {
    updateFamilyInfoData(familyInfoData?.family_info_data?.length || 0, {
      'id': crypto.randomUUID(),
      'name': 'New Member',
      'date-of-birth': '2000-01-01',
      'life-expectancy': 90,
      'retirement-age': 65,
    });
  };

  const renderFamilyCards = () => {
    if (error) return null;
    
    const memberCards = familyInfoData?.family_info_data?.length ? 
      familyInfoData.family_info_data.map((member, index) => (
        <Card 
          className="rounded-2xl shadow-md" 
          sx={{ 
            mb: 2, 
            width: 300,
            minWidth: 300, // Prevent shrinking
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#d4d4d4ff',
              transform: 'translateY(-2px)',
              boxShadow: 3
            },
            transition: 'all 0.2s ease-in-out'
          }} 
          key={index}
          onClick={() => handleCardClick(index)}
        >
          <CardContent className="p-4">
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonIcon/>
              <h3 className="text-sm">{member['name']}</h3>
            </Stack>
            <Stack direction={"column"} spacing={0.5} alignItems="left" className="mb-2">
              <p className="text-sm">Age: {Math.floor((new Date() - new Date(member['date-of-birth'])) / (365.25 * 24 * 60 * 60 * 1000))} | Retirement Age: {member['retirement-age']}</p>
              <p className="text-sm">Life Expectancy: {member['life-expectancy']}</p>
              <p className="text-sm">Balance: </p>
            </Stack>
            <LinearProgress variant="determinate" value={50} className="mt-2" />
          </CardContent>
        </Card>
      )) : [];

    // Add Member card
    const addMemberCard = (
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
        key="add-member"
        onClick={handleAddMember}
      >
        <CardContent className="p-4">
          <Stack direction="column" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 120 }}>
            <AddIcon sx={{ fontSize: 40, color: '#666' }} />
            <Typography variant="h6" color="textSecondary">
              Add Member
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );

    return [...memberCards, addMemberCard];
  };

  return (
    <div>
      <h2>Family Information</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!loading && !error && familyInfoData?.family_info_data?.length === 0 && (
        <Card sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <p>No family members found. Please add a member.</p>
        </Card>
      )}
      
      <Box 
        sx={{ 
          display: 'flex', 
          overflowX: 'auto',
          gap: 2, 
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 8,
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
        {renderFamilyCards()}
      </Box>
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        disableEnforceFocus
        disableAutoFocus
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Edit Family Member</Typography>
            <IconButton onClick={handleDrawerClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          
          {editingMember !== null && familyInfoData?.family_info_data?.[editingMember] && (
            <Stack spacing={2}>
              <TextField 
                label="Name" 
                name="name"
                variant="outlined"
                fullWidth
                value={getFormData(editingMember)['name'] || familyInfoData.family_info_data[editingMember]['name']}
                onChange={handleChange(editingMember)}
              />
              <TextField
                label="Date of Birth"
                name="date-of-birth"
                variant="outlined"
                fullWidth
                type="date"
                slotProps={{ htmlInput: { max: new Date().toISOString().split('T')[0] } }}
                value={getFormData(editingMember)['date-of-birth'] || familyInfoData.family_info_data[editingMember]['date-of-birth']}
                onChange={handleChange(editingMember)}
              />
              <TextField
                label="Retirement Age"
                name="retirement-age"
                variant="outlined"
                fullWidth
                type="number"
                slotProps={{ htmlInput: { min: 50, max: 80 } }}
                value={getFormData(editingMember)['retirement-age'] || familyInfoData.family_info_data[editingMember]['retirement-age']}
                onChange={handleChange(editingMember)}
              />
              <TextField
                label="Life Expectancy"
                name="life-expectancy"
                variant="outlined"
                fullWidth
                type="number"
                slotProps={{ htmlInput: { min: 60, max: 120 } }}
                value={getFormData(editingMember)['life-expectancy'] || familyInfoData.family_info_data[editingMember]['life-expectancy']}
                onChange={handleChange(editingMember)}
              />
              <Button 
                variant="outlined" 
                color="error" 
                disabled={loading}
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  deleteMember(editingMember);
                  setDrawerOpen(false);
                }}
              >
                {loading ? 'Deleting...' : 'Delete Member'}
              </Button>
            </Stack>
          )}
        </Box>
      </Drawer>
    </div>
  );
}