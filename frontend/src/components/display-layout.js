import React from 'react';
import { Box, Grid, Paper } from '@mui/material';

/**
 * DisplayLayout - A component to mimic Toolpad's DisplayLayout using MUI core
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display in the layout
 * @param {number} props.spacing - Grid spacing (1-10)
 * @param {number} props.columns - Number of columns in the grid (1-12)
 * @param {string} props.alignItems - Alignment of items ('start', 'center', 'end', 'stretch')
 * @param {Object} props.sx - Additional styling
 */
const DisplayLayout = ({ 
  items = [], 
  spacing = 2, 
  columns = 12, 
  alignItems = 'stretch',
  sx = {}
}) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Grid container spacing={spacing} alignItems={alignItems}>
        {items.map((item, index) => {
          // Default to full width if no columnSpan is provided
          const columnSpan = item.columnSpan || columns;
          
          // Calculate how many columns this item should span (max 12)
          const gridColumns = Math.min(columnSpan, columns);
          
          return (
            <Grid item xs={12} md={gridColumns} key={index}>
              <Paper 
                elevation={item.elevation || 1}
                sx={{ 
                  p: 2, 
                  height: item.height || 'auto',
                  ...item.sx
                }}
              >
                {item.content}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default DisplayLayout;
