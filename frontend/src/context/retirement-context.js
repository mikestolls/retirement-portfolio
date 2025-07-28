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
  const [retirementData, setRetirementData] = useState({ retirement_data: [
    {
      'initial-investment': 1000,
      'regular-contribution': 10,
      'contribution-frequency': 12,
      'age': 18,
      'retirement-age': 65,
      'retirement-withdrawal': 4,
      'retirement-inflation': 2,
    }
  ] });

  const fetchRetirementData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch data from the backend API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/get_retirement_data`);

      if (!response.ok) {
        throw new Error('Failed to fetch retirement data');
      }

      const data = await response.json();
      setRetirementData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRetirementData = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      // Send updated data to the backend API
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/update_retirement_input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update data');
      }
      
      await fetchRetirementData();
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
      retirementData, 
      familyInfoData,
      loading, 
      error,
      updateRetirementData,
      updateFamilyInfoData,
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);