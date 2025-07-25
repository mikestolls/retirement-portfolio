import React, { useState } from 'react';
import { useRetirement } from '../context/retirement-context';

import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { Stack } from '@mui/material';
import Button from '@mui/material/Button';

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
  const withdrawal_frequencies = [
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
export default function InputData() {
    const [formData, setFormData] = useState({
        'initial-investment': 1000,
        'regular-contribution': 10,
        'contribution-frequency': 12,
        'age': 18,
        'retirement-age': 65,
        'retirement-withdrawal': 4,
        'retirement-inflation': 2,
    });
    // Use the shared context
    const { updateRetirementData, loading, error } = useRetirement();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    async function handleSubmit(event) {
        event.preventDefault();
        
        // Frontend validation
        const requiredFields = ['initial-investment', 'regular-contribution', 'age', 'retirement-age'];
        for (const field of requiredFields) {
            if (Number(formData[field]) < 0) {
                return;
            }
        }
        
        if (Number(formData['age']) >= Number(formData['retirement-age'])) {
            return;
        }
        
        const formDataToSubmit = {
            initial_investment: Number(formData['initial-investment']),
            regular_contribution: Number(formData['regular-contribution']),
            contribution_frequency: Number(formData['contribution-frequency']),
            age: Number(formData['age']),
            retirement_age: Number(formData['retirement-age']),
            retirement_withdrawal: Number(formData['retirement-withdrawal']),
            retirement_inflation: Number(formData['retirement-inflation']),
        };
    
        // Use the context function to update data
        await updateRetirementData(formDataToSubmit);
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <TextField 
                    label="Initial Investment" 
                    name="initial-investment"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                    value={formData['initial-investment']}
                    onChange={handleChange}/>
                <TextField
                    label="Regular Contribution"
                    name="regular-contribution"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                    value={formData['regular-contribution']}
                    onChange={handleChange}/>
                <TextField 
                    label="Frequency"
                    name="contribution-frequency"
                    select
                    variant="standard"
                    align="left"
                    required
                    value={formData['contribution-frequency']}
                    onChange={handleChange}>
                    {contribution_frequencies.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Age"
                    name="age"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    value={formData['age']}
                    onChange={handleChange}/>
                <TextField
                    label="Retirement Age"
                    name="retirement-age"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    value={formData['retirement-age']}
                    onChange={handleChange}/>
                <TextField
                    label="Retirement Withdrawal %"
                    name="retirement-withdrawal"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }}
                    value={formData['retirement-withdrawal']}
                    onChange={handleChange}/>
                <TextField
                    label="Retirement Inflation %"
                    name="retirement-inflation"
                    variant="standard"
                    required
                    type="number"
                    slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }}
                    value={formData['retirement-inflation']}
                    onChange={handleChange}/>
            </Stack>
            <Button type="submit" variant="contained" size="large" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit'}
            </Button>
            </form>
        </div>
    );
}
