import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
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
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
      <div>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                  <Tab label="Child One" {...tabProperty(0)} />
                  <Tab label="Child Two" {...tabProperty(1)} />
                  <Tab label="Child Three" {...tabProperty(2)} />
              </Tabs>
          </Box>
          <FamilyTabPanel value={value} index={0}>
              Item One
          </FamilyTabPanel>
          <FamilyTabPanel value={value} index={1}>
              Item Two
          </FamilyTabPanel>
          <FamilyTabPanel value={value} index={2}>
              Item Three
          </FamilyTabPanel>
      </div>
  );
}