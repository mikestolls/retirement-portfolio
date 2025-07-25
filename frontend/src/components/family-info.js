import React, { useState } from 'react';
import { 
  Typography, Grid, TextField, Button, Paper, Box, 
  Divider, IconButton, Avatar, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRetirement } from '../context/retirement-context';

export default function FamilyInfo() {
  const { updateFamilyInfo } = useRetirement();
  const [primaryPerson, setPrimaryPerson] = useState({
    name: '',
    age: 30,
    retirementAge: 65,
    lifeExpectancy: 90
  });
  
  const [dependents, setDependents] = useState([]);
  
  const handlePrimaryChange = (e) => {
    setPrimaryPerson({
      ...primaryPerson,
      [e.target.name]: e.target.value
    });
  };
  
  const addDependent = () => {
    setDependents([
      ...dependents, 
      { name: '', relationship: 'Spouse', age: 30 }
    ]);
  };
  
  const removeDependent = (index) => {
    const newDependents = [...dependents];
    newDependents.splice(index, 1);
    setDependents(newDependents);
  };
  
  const handleDependentChange = (index, e) => {
    const newDependents = [...dependents];
    newDependents[index] = {
      ...newDependents[index],
      [e.target.name]: e.target.value
    };
    setDependents(newDependents);
  };
  
  const handleSubmit = () => {
    updateFamilyInfo({
      primary: primaryPerson,
      dependents: dependents
    });
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Family Information</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter details about yourself and your dependents to personalize your retirement plan.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Primary Person</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={primaryPerson.name}
              onChange={handlePrimaryChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Current Age"
              name="age"
              type="number"
              value={primaryPerson.age}
              onChange={handlePrimaryChange}
              InputProps={{ inputProps: { min: 0, max: 120 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Planned Retirement Age"
              name="retirementAge"
              type="number"
              value={primaryPerson.retirementAge}
              onChange={handlePrimaryChange}
              InputProps={{ inputProps: { min: primaryPerson.age, max: 120 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Life Expectancy"
              name="lifeExpectancy"
              type="number"
              value={primaryPerson.lifeExpectancy}
              onChange={handlePrimaryChange}
              InputProps={{ inputProps: { min: primaryPerson.retirementAge, max: 120 } }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Dependents</Typography>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            color="primary"
            onClick={addDependent}
          >
            Add Dependent
          </Button>
        </Box>
        
        {dependents.length === 0 ? (
          <Typography color="text.secondary" align="center" py={3}>
            No dependents added yet. Click "Add Dependent" to include family members.
          </Typography>
        ) : (
          dependents.map((dependent, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={dependent.name}
                    onChange={(e) => handleDependentChange(index, e)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    select
                    label="Relationship"
                    name="relationship"
                    value={dependent.relationship}
                    onChange={(e) => handleDependentChange(index, e)}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Other">Other</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Age"
                    name="age"
                    type="number"
                    value={dependent.age}
                    onChange={(e) => handleDependentChange(index, e)}
                    InputProps={{ inputProps: { min: 0, max: 120 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <IconButton 
                    color="error" 
                    onClick={() => removeDependent(index)}
                    aria-label="delete dependent"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          ))
        )}
      </Paper>
      
      <Box display="flex" justifyContent="flex-end">
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleSubmit}
        >
          Save Family Information
        </Button>
      </Box>
    </Box>
  );
}
