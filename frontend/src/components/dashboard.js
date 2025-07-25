import React from 'react';
import { Typography, Card, CardContent } from '@mui/material';
import DisplayLayout from './disp';

const Dashboard = () => {
  // Your data and state management here
  
  return (
    <DisplayLayout
      spacing={3}
      columns={12}
      items={[
        // Summary cards row - 4 cards each taking 3 columns
        {
          columnSpan: 3,
          content: (
            <Card>
              <CardContent>
                <Typography variant="h6">Current Age</Typography>
                <Typography variant="h4">35</Typography>
                <Typography variant="body2">30 years until retirement</Typography>
              </CardContent>
            </Card>
          )
        },
        {
          columnSpan: 3,
          content: (
            <Card>
              <CardContent>
                <Typography variant="h6">Current Balance</Typography>
                <Typography variant="h4">$125,000</Typography>
                <Typography variant="body2">Total across all accounts</Typography>
              </CardContent>
            </Card>
          )
        },
        {
          columnSpan: 3,
          content: (
            <Card>
              <CardContent>
                <Typography variant="h6">Projected at Retirement</Typography>
                <Typography variant="h4">$1,250,000</Typography>
                <Typography variant="body2">At age 65</Typography>
              </CardContent>
            </Card>
          )
        },
        {
          columnSpan: 3,
          content: (
            <Card>
              <CardContent>
                <Typography variant="h6">Monthly Income</Typography>
                <Typography variant="h4">$4,167</Typography>
                <Typography variant="body2">Estimated in retirement</Typography>
              </CardContent>
            </Card>
          )
        },
      ]}
    />
  );
};

export default Dashboard;
