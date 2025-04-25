import React, { useState, useEffect } from 'react';

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

export default function InputData() {
    const [formData, setFormData] = useState({
        'initial-investment': 0,
        'regular-contribution': 0,
        'contribution-frequency': 12,
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    async function handleSubmit(event) {
        event.preventDefault();
        const formDataToSubmit = {
            initial_investment: Number(formData['initial-investment']),
            regular_contribution: Number(formData['regular-contribution']),
            frequency: Number(formData['contribution-frequency'])
        };
    
        try {
            console.log(formDataToSubmit);
    
            const response = await fetch('XXXXXXXXXXXXXXXXXXXXXXXXXXXX', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    initial_investment: data.get('initial-investment'),
                    regular_contribution: data.get('regular-contribution'),
                    frequency: data.get('contribution-frequency'),
                }),
            });
            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    }

    return (
        //Initial Investment
        //Regular Contribution
        //Frequency
        //Age
        //Retirement Age
        //Base Retirement Withdrawal %
        //Retirement Inflation %
        //Contributions per Year
        <div>
            <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <TextField 
                    label="Initial Investment" 
                    name="initial-investment"
                    variant="standard"
                    required
                    type="number"
                    value={formData['initial-investment']}
                    onChange={handleChange}/>
                <TextField
                    label="Regular Contribution"
                    name="regular-contribution"
                    variant="standard"
                    required
                    type="number"
                    value={formData['regular-contribution']}
                    onChange={handleChange}/>
                <TextField 
                    label="Frequency"
                    name="contribution-frequency"
                    select
                    variant="standard"
                    align="left"
                    required
                    type="number"
                    value={formData['contribution-frequency']}
                    onChange={handleChange}>
                    {contribution_frequencies.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>
            <Button type="submit" variant="contained" size="large">
                Submit
            </Button>
            </form>
        </div>
    );
}
