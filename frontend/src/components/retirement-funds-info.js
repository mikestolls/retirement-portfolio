import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRetirement } from '../context/retirement-context';

import { Box, Tabs, Tab, Button } from '@mui/material';
import PropTypes from 'prop-types';

function RetirementFundsTabPanel(props) {
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

RetirementFundsTabPanel.propTypes = {
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

export default function RetirementFundsInfo() {
  // Use the shared context
  const { updateFamilyInfoData, fetchFamilyInfoData, familyInfoData, loading, error } = useRetirement();

  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => { fetchFamilyInfoData(); }, []);

  return (
      <div>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label='Retirement Funds Info Tabs'>
                {familyInfoData?.familyinfo_data?.map((member, index) => (
                  <Tab
                    key={index}
                    label={member.name}
                    {...tabProperty(0)}
                  />
                ))}
                <Tab label="Add Member" {...tabProperty(1)} onClick={() => updateFamilyInfoData({ name: 'New Member', age: 0 })}/>
              </Tabs>
          </Box>
          {familyInfoData?.familyinfo_data?.map((member, index) => (
            <RetirementFundsTabPanel key={index} value={activeTab} index={index}>
              <p>{member.name}</p>
              <p>{member.age}</p>
              <Button variant="contained" onClick={() => updateFamilyInfoData(member)}>
                Update {member.name}
              </Button>
              <Button variant="contained" onClick={() => updateFamilyInfoData(index, true)}>
                Delete {member.name}
              </Button>
            </RetirementFundsTabPanel>
          ))}
      </div>
  );
}