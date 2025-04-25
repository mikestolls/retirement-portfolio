import React from 'react';
import { Table } from '@mui/material';
import { TableBody } from '@mui/material';
import { TableCell } from '@mui/material';
import { TableContainer } from '@mui/material';
import { TableHead } from '@mui/material';
import { TableRow } from '@mui/material';

import '../css/year-by-year-table.css';

export default function YearByYearTable() {
    const data = [
        { year: 2020, value: 100 },
        { year: 2021, value: 200 },
        { year: 2022, value: 300 },
        { year: 2023, value: 400 },
    ];
    
    return (
        <div className="YearByYearTable" style={{width: '80%', margin: 'auto'}}>   
            <TableContainer>
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell>Year</TableCell>
                    <TableCell>Value</TableCell>
                </TableRow>
                </TableHead>
                <TableBody sx={{ color: 'white' }}>
                {data.map((row) => (
                    <TableRow key={row.year}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </div>
    );
}