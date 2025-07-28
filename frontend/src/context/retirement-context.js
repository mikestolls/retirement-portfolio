import React, { createContext, useState, useContext } from 'react';

const RetirementContext = createContext();

export const RetirementProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // defaulting family info data
  const [familyInfoData, setFamilyInfoData] = useState({ familyinfo_data: [
    {
      name: 'Stolz',
      age: 39,
    }
  ] });

  // defaulting retirement data
  const [retirementFundInfoData, setRetirementFundInfoData] = useState({ retirementfund_data: [
    {
      'name': 'Fund',
      'initial-investment': 1000,
      'regular-contribution': 10,
      'contribution-frequency': 12,
      'retirement-age': 65,
      'retirement-withdrawal': 4,
      'retirement-inflation': 2,
    }
  ] });

  const fetchRetirementFundInfoData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_retirement_fund_data`);
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

  const updateRetirementFundInfoData  = async (fundIndex, updatedFund) => {
    setLoading(true);
    setError(null);

    try {      
      const updatedData = {
        ...retirementFundInfoData,
        retirementfund_data: updatedFund === null
          ? // Delete fund at fundIndex
            (retirementFundInfoData?.retirementfund_data || []).filter((_, index) => index !== fundIndex)
          : fundIndex < (retirementFundInfoData?.retirementfund_data?.length || 0)
            ? // Update existing fund
              (retirementFundInfoData?.retirementfund_data || []).map((fund, index) => 
                index === fundIndex ? { ...fund, ...updatedFund } : fund
              )
            : // Add new fund
              [...(retirementFundInfoData?.retirementfund_data || []), updatedFund]
      };

      // Try to sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_retirement_fund_data`, {
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

  const fetchFamilyInfoData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_family_info`);
        if (response.ok) {
          const data = await response.json();
          setFamilyInfoData(data);
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
        familyinfo_data: updatedMember === null
          ? // Delete member at memberIndex
            (familyInfoData?.familyinfo_data || []).filter((_, index) => index !== memberIndex)
          : memberIndex < (familyInfoData?.familyinfo_data?.length || 0)
            ? // Update existing member
              (familyInfoData?.familyinfo_data || []).map((member, index) => 
                index === memberIndex ? { ...member, ...updatedMember } : member
              )
            : // Add new member
              [...(familyInfoData?.familyinfo_data || []), updatedMember]
      };

      // Try to sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_family_info`, {
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

  return (
    <RetirementContext.Provider value={{ 
      retirementFundInfoData, 
      familyInfoData,
      loading, 
      error,
      updateRetirementFundInfoData ,
      updateFamilyInfoData,
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);