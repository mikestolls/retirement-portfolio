import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const RetirementContext = createContext();

export const RetirementProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const initRef = useRef(false);

  const user_id = 'test_user'; // Replace with actual user ID logic
  
  useEffect(() => {
    if (initRef.current) return; // Prevent duplicate runs
    initRef.current = true;

    const initializeDefaultData = async () => {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          // Save default family info
          await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_family_info/${user_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(familyInfoData)
          });

          // Save default retirement fund info
          await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_retirement_fund_data/${user_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(retirementFundInfoData)
          });
        } catch (error) {
          console.warn('Failed to initialize default data:', error);
        }
      }
    };

    initializeDefaultData();
  }, []); // Run once on mount

  // defaulting family info data
  const [familyInfoData, setFamilyInfoData] = useState({ family_info_data: [
    {
      'id': crypto.randomUUID(),
      'name': 'Stolz',
      'age': 39,
      'life-expectancy': 90,
      'retirement-age': 65,
    }
  ] });

  // defaulting retirement data
  const [retirementFundInfoData, setRetirementFundInfoData] = useState({ retirement_fund_data: [
    {
      'name': 'Fund',
      'family-member-id': '',
      'initial-investment': 1000,
      'regular-contribution': 10,
      'contribution-frequency': 12,
    }
  ] });

  const fetchFamilyInfoData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_family_info/${user_id}`);
        if (response.ok) {
          const data = await response.json();

          setFamilyInfoData({ family_info_data: data.family_info_data });
          return;
        }
      }
      // Fallback to offline data - keep existing data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_retirement_fund_data/${user_id}`);
        if (response.ok) {
          const data = await response.json();

          setRetirementFundInfoData(data);
          return;
        }
      }
      // Fallback to offline data - keep existing data
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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

  return (
    <RetirementContext.Provider value={{ 
      retirementFundInfoData, 
      familyInfoData,
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