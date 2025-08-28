import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';

const RetirementContext = createContext();

const DEFAULT_FAMILY_MEMBER = {
  'id': '',
  'name': 'Stolz',
  'date-of-birth': '1986-01-31',
  'life-expectancy': 90,
  'retirement-age': 65,
};

const DEFAULT_RETIREMENT_FUND = {
  'name': 'Fund',
  'family-member-id': '',
  'initial-investment': 1000,
  'regular-contribution': 10,
  'contribution-frequency': 12,
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
  const [retirementFundInfoData, setRetirementFundInfoData] = useState({ retirement_fund_data: [DEFAULT_RETIREMENT_FUND] });

  const fetchFamilyInfoData = async () => {
    if (fetchingRef.current.family) return;
    fetchingRef.current.family = true;
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_family_info/${user_id}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.family_info_data) {
            setFamilyInfoData({ family_info_data: data.family_info_data });
          }
          return;
        } else if (response.status === 404) {
          // Create and save default family info for new user
          const newId = crypto.randomUUID();
          const memberWithId = { ...DEFAULT_FAMILY_MEMBER, 'id': newId };
          await updateFamilyInfoData(0, memberWithId);
          // Update retirement fund to use the new family member ID
          await updateRetirementFundInfoData(0, { 'family-member-id': newId });
          return;
        }
      }
      // Fallback to offline data - keep existing data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      fetchingRef.current.family = false;
    }
  };
  
  const updateFamilyInfoData = async (memberIndex, updatedMember) => {
    setLoading(true);
    setError(null);

    try {      
      const updatedData = {
        ...familyInfoData,
        family_info_data: updatedMember === null
          ? // Delete member at memberIndex
            (familyInfoData?.family_info_data || []).filter((_, index) => index !== memberIndex)
          : memberIndex < (familyInfoData?.family_info_data?.length || 0)
            ? // Update existing member
              (familyInfoData?.family_info_data || []).map((member, index) => 
                index === memberIndex ? { ...member, ...updatedMember } : member
              )
            : // Add new member
              [...(familyInfoData?.family_info_data || []), updatedMember]
      };

      // Try to sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_family_info/${user_id}`, {
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
      setFamilyInfoData(updatedData);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRetirementFundInfoData = async () => {
    if (fetchingRef.current.retirement) return;
    fetchingRef.current.retirement = true;
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_retirement_fund_data/${user_id}`);
        if (response.ok) {
          const data = await response.json();
          setRetirementFundInfoData(data);
          return;
        } else if (response.status === 404) {
          // Create and save default retirement fund info for new user
          await updateRetirementFundInfoData(0, DEFAULT_RETIREMENT_FUND);
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

  const updateRetirementFundInfoData = async (fundIndex, updatedFund) => {
    setLoading(true);
    setError(null);

    try {      
      const updatedData = {
        ...retirementFundInfoData,
        retirement_fund_data: updatedFund === null
          ? // Delete fund at fundIndex
            (retirementFundInfoData?.retirement_fund_data || []).filter((_, index) => index !== fundIndex)
          : fundIndex < (retirementFundInfoData?.retirement_fund_data?.length || 0)
            ? // Update existing fund
              (retirementFundInfoData?.retirement_fund_data || []).map((fund, index) => 
                index === fundIndex ? { ...fund, ...updatedFund } : fund 
              )
            : // Add new fund
              [...(retirementFundInfoData?.retirement_fund_data || []), updatedFund]
      };

      // Try to sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_retirement_fund_data/${user_id}`, {
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
      setRetirementFundInfoData(updatedData);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const householdProjection = useMemo(() => {
    if (!retirementFundInfoData?.retirement_fund_data || !familyInfoData?.family_info_data) return { data: [], legendMap: {} };
    
    const yearData = {};
    const legendMap = {};
    
    retirementFundInfoData.retirement_fund_data.forEach((fund, fundIndex) => {
      if (fund.retirement_projection) {
        const member = familyInfoData.family_info_data.find(m => m.id === fund['family-member-id']);
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
  }, [retirementFundInfoData, familyInfoData]);

  return (
    <RetirementContext.Provider value={{ 
      retirementFundInfoData, 
      familyInfoData,
      householdProjection,
      loading, 
      error,
      updateFamilyInfoData,
      fetchFamilyInfoData,
      updateRetirementFundInfoData,
      fetchRetirementFundInfoData
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);