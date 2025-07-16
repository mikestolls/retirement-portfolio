import React, { useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Table } from '@mui/material';
import { TableBody } from '@mui/material';
import { TableCell } from '@mui/material';
import { TableContainer } from '@mui/material';
import { TableHead } from '@mui/material';
import { TableRow } from '@mui/material';

import '../css/year-by-year-table.css';

export default function YearByYearTable() {
    const { retirementData, loading, error } = useRetirement();
     
    // Use the data from context
    const data = retirementData?.retirement_data || [];
    
    return (
        <div className="YearByYearTable" style={{width: '80%', margin: 'auto'}}>   
            <TableContainer>
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell>Age</TableCell>
                    <TableCell>Begin Amount</TableCell>
                    <TableCell>Contribution</TableCell>
                    <TableCell>Growth</TableCell>
                    <TableCell>End Amount</TableCell>
                </TableRow>
                </TableHead>
                <TableBody sx={{ color: 'white' }}>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} align="center">Loading...</TableCell>
                    </TableRow>
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={5} align="center" style={{color: 'red'}}>{error}</TableCell>
                    </TableRow>
                ) : data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} align="center">No data available. Please submit the form.</TableCell>
                    </TableRow>
                ) : (
                    data.map((row) => (
                        <TableRow key={row.age}>
                            <TableCell>{row.age}</TableCell>
                            <TableCell>${row.begin_amount.toLocaleString()}</TableCell>
                            <TableCell>${row.contribution.toLocaleString()}</TableCell>
                            <TableCell>${row.growth.toLocaleString()}</TableCell>
                            <TableCell>${row.end_amount.toLocaleString()}</TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </TableContainer>
        </div>
    );
}