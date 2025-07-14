import React, { createContext, useState, useContext } from 'react';

const RetirementContext = createContext();

export const RetirementProvider = ({ children }) => {
  const [retirementData, setRetirementData] = useState({ retirement_data: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <RetirementContext.Provider value={{ 
      retirementData, 
      loading, 
      error, 
      fetchRetirementData,
      updateRetirementData
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);