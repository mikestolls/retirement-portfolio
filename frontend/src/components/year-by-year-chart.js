import React from 'react';
import { useRetirement } from '../context/retirement-context';

import { LineChart } from '@mui/x-charts/LineChart';

export default function YearByYearChart() {
    const { retirementData, loading, error } = useRetirement();
    
    // Use the data from context
    const data = retirementData?.retirement_data || [];
  
    if (data.length === 0) {
        return <p>No data available to display chart</p>;
    }
    
    return (
    <div style={{ width: '80%', height: 400, margin: 'auto' }}>
        <LineChart
        xAxis={[{ 
            data: data.map(item => item.age),
            label: 'Age' 
        }]}
        series={[
            {
            data: data.map(item => item.end_amount),
            label: 'Portfolio Value',
            valueFormatter: (value) => `$${value.toLocaleString()}`
            }
        ]}
        height={400}
        />
    </div>
    );
}
