import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';

const RetirementContext = createContext();

const DEFAULT_FAMILY_MEMBER = {
  'id': '',
  'name': 'Stolz',
  'date_of_birth': '1986-01-31',
  'life_expectancy': 90,
  'retirement_age': 65,
};

const DEFAULT_RETIREMENT_FUND = {
  'id': crypto.randomUUID(),
  'name': 'Fund',
  'family_member_id': '',
  'initial_investment': 1000,
  'regular_contribution': 10,
  'contribution_frequency': 12,
};

export const RetirementProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initRef = useRef(false);
  const fetchingRef = useRef({ family: false, retirement: false });

  const user_id = 'test_user'; // Replace with actual user ID logic
  
  // defaulting family info data
  const [familyInfoData, setFamilyInfoData] = useState({ family_info_data: [DEFAULT_FAMILY_MEMBER] });

  // defaulting retirement data
  const [retirementData, setRetirementData] = useState({ retirement_fund_data: [DEFAULT_RETIREMENT_FUND] });

  const fetchRetirementData = async () => {
    if (fetchingRef.current.retirement) return;
    fetchingRef.current.retirement = true;
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_retirement_data/${user_id}`);
        if (response.ok) {
          const data = await response.json();
          // Set both retirement and family data from combined response
          if (data.retirement_fund_data) {
            setRetirementData({ retirement_fund_data: data.retirement_fund_data });
          }
          if (data.family_info_data) {
            setFamilyInfoData({ family_info_data: data.family_info_data });
          }
          return;
        } else if (response.status === 404) {
          // Create default data for new user
          const newId = crypto.randomUUID();
          const memberWithId = { ...DEFAULT_FAMILY_MEMBER, 'id': newId };
          const fundWithMemberId = { ...DEFAULT_RETIREMENT_FUND, 'family_member_id': newId };
          
          // Save both family and retirement data
          await updateFamilyInfoData(0, memberWithId);
          await updateRetirementData(0, fundWithMemberId);
          
          // Fetch the data again to get calculated projections
          fetchingRef.current.retirement = false; // Reset flag to allow refetch
          await fetchRetirementData();
          return;
        }
      }
      // Fallback to offline data - keep existing data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current.retirement = false;
    }
  };

  const updateFamilyInfoData = async (memberIndex, updatedMember) => {
    setLoading(true);
    setError(null);

    try {      
      const updatedFamilyData = {
        ...familyInfoData,
        family_info_data: updatedMember === null
          ? (familyInfoData?.family_info_data || []).filter((_, index) => index !== memberIndex)
          : memberIndex < (familyInfoData?.family_info_data?.length || 0)
            ? (familyInfoData?.family_info_data || []).map((member, index) => 
                index === memberIndex ? { ...member, ...updatedMember } : member
              )
            : [...(familyInfoData?.family_info_data || []), updatedMember]
      };

      // Sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_family_info/${user_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFamilyData)
        });
        if (!response.ok) throw new Error('Backend sync failed');
      }
      
      setFamilyInfoData(updatedFamilyData);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateRetirementData = async (fundIndex, updatedFund) => {
    setLoading(true);
    setError(null);

    try {      
      const updatedData = {
        ...retirementData,
        retirement_fund_data: updatedFund === null
          ? // Delete fund at fundIndex
            (retirementData?.retirement_fund_data || []).filter((_, index) => index !== fundIndex)
          : fundIndex < (retirementData?.retirement_fund_data?.length || 0)
            ? // Update existing fund
              (retirementData?.retirement_fund_data || []).map((fund, index) => 
                index === fundIndex ? { ...fund, ...updatedFund } : fund 
              )
            : // Add new fund
              [...(retirementData?.retirement_fund_data || []), updatedFund]
      };

      // Try to sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_retirement_data/${user_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
          });
          if (!response.ok) throw new Error('Backend sync failed');
        } catch (backendError) {
          console.warn('Backend sync failed, continuing offline:', backendError);
        }
      }
      
      // Update local state regardless of backend status
      setRetirementData(updatedData);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateActualBalance = async (fundId, year, actualBalance, actualContributions, actualGrowth) => {
    setLoading(true);
    setError(null);

    try {
      // Try to sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          const fund = retirementData.retirement_fund_data.find(f => f.id === fundId);
          const existingActualData = fund?.actual_data || [];
          
          const actualData = { 
            year: parseInt(year), 
            actual_balance: parseFloat(actualBalance),
            actual_contributions: parseFloat(actualContributions),
            actual_growth: parseFloat(actualGrowth)
          };
          
          // Remove existing entry for this year and add new one
          const updatedActualData = existingActualData
            .filter(data => parseInt(data.year) !== parseInt(year))
            .map(data => ({
              year: parseInt(data.year),
              actual_balance: parseFloat(data.actual_balance),
              actual_contributions: parseFloat(data.actual_contributions),
              actual_growth: parseFloat(data.actual_growth)
            }));
          updatedActualData.push(actualData);
          
          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_retirement_data/${user_id}/funds/${fundId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual_data: updatedActualData })
          });
          if (!response.ok) throw new Error('Backend sync failed');
        } catch (backendError) {
          console.warn('Backend sync failed, continuing offline:', backendError);
        }
      }
      
      // Update local state
      const updatedData = { ...retirementData };
      const fund = updatedData.retirement_fund_data.find(f => f.id === fundId);
      if (fund) {
        if (!fund.actual_data) {
          fund.actual_data = [];
        }
        // Remove existing entry for this year
        fund.actual_data = fund.actual_data.filter(data => parseInt(data.year) !== parseInt(year));
        // Add new entry
        const newActualData = { 
          year: parseInt(year), 
          actual_balance: parseFloat(actualBalance),
          actual_contributions: parseFloat(actualContributions),
          actual_growth: parseFloat(actualGrowth)
        };
        fund.actual_data.push(newActualData);
        setRetirementData(updatedData);
      }
      
      // Refresh to recalculate projections with actual data
      await fetchRetirementData();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRetirementData(); // This now fetches both retirement and family data
  }, []);

  const householdProjection = useMemo(() => {
    if (!retirementData?.retirement_fund_data || !familyInfoData?.family_info_data) return { data: [], legendMap: {} };
    
    const yearData = {};
    const legendMap = {};
    
    retirementData.retirement_fund_data.forEach((fund, fundIndex) => {
      if (fund.retirement_projection) {
        const member = familyInfoData.family_info_data.find(m => m.id === fund['family_member_id']);
        const fundKey = `fund_${fundIndex}`;
        const legendName = `${fund.name} (${member?.name || 'Unknown'})`;
        
        legendMap[fundKey] = legendName;
        
        fund.retirement_projection.forEach(projection => {
          if (!yearData[projection.year]) {
            yearData[projection.year] = { year: projection.year, total: 0 };
          }
          yearData[projection.year][fundKey] = projection.end_amount;
          yearData[projection.year].total += projection.end_amount;
        });
      }
    });
    
    return {
      data: Object.values(yearData).sort((a, b) => a.year - b.year),
      legendMap
    };
  }, [retirementData, familyInfoData]);

  return (
    <RetirementContext.Provider value={{ 
      retirementData, 
      familyInfoData,
      householdProjection,
      loading, 
      error,
      updateFamilyInfoData,
      updateRetirementData,
      fetchRetirementData,
      updateActualBalance
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);