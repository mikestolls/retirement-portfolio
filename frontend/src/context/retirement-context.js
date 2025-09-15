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
  
  // State for the new 4-table structure
  const [userData, setUserData] = useState({
    user: null,
    family_info: null,
    retirement_funds: [],
    budgets: []
  });

  const fetchUserData = async () => {
    if (fetchingRef.current.retirement) return;
    fetchingRef.current.retirement = true;
    setLoading(true);
    setError(null);

    try {
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/user_data/${user_id}`);
        
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          return;
        } else if (response.status === 404 || response.status === 500) {
          // No data exists, create defaults using the new optimized flow
          await createDefaultUserData();
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

  const createDefaultUserData = async () => {
    try {
      const newId = crypto.randomUUID();
      const familyId = crypto.randomUUID();
      const fundId = crypto.randomUUID();
      const budgetId = crypto.randomUUID();
      
      const memberWithId = { ...DEFAULT_FAMILY_MEMBER, 'id': newId };
      const fundWithMemberId = { ...DEFAULT_RETIREMENT_FUND, 'family_member_id': newId };
      
      // Create default data - each POST returns the created record (no need for additional GET)
      const [familyResponse, fundResponse, budgetResponse] = await Promise.all([
        createDefaultFamily(familyId, [memberWithId]),
        createDefaultFund(fundId, fundWithMemberId),
        createDefaultBudget(budgetId, familyId)
      ]);

      // Build userData from the returned data
      const newUserData = {
        user: { user_id: user_id, family_id: familyId },
        family_info: familyResponse,
        retirement_funds: [fundResponse],
        budgets: [budgetResponse]
      };
      
      setUserData(newUserData);

    } catch (error) {
      console.error('Error creating default data:', error);
      setError('Failed to create default data');
    }
  };

  const createDefaultFamily = async (familyId, familyMembers) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/family_info/${familyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_data: familyMembers })
    });
    if (!response.ok) throw new Error('Failed to create family');
    const result = await response.json();
    return result.family || result;
  };

  const createDefaultFund = async (fundId, fundData) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/retirement_fund/${fundId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fund_data: fundData })
    });
    if (!response.ok) throw new Error('Failed to create fund');
    const result = await response.json();
    return result.fund || result;
  };

  const createDefaultBudget = async (budgetId, familyId) => {
    const defaultBudgetData = {
      family_id: familyId,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      planned_income: 5000,
      planned_expenses: 4000,
      actual_income: 0,
      actual_expenses: 0
    };
    
    const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/budget/${budgetId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget_data: defaultBudgetData })
    });
    if (!response.ok) throw new Error('Failed to create budget');
    const result = await response.json();
    return result.budget || result;
  };

  const updateRetirementFund = async (fundIdentifier, updatedFund) => {
    setLoading(true);
    setError(null);

    try {
      const userId = userData?.user?.id;
      if (!userId) throw new Error('User ID not available');

      let fundId;
      
      // Handle both index-based (legacy) and ID-based calls
      if (typeof fundIdentifier === 'number') {
        // Legacy: index-based call
        const currentFunds = userData?.retirement_funds || [];
        if (fundIdentifier < currentFunds.length) {
          fundId = currentFunds[fundIdentifier]?.id;
        } else {
          // New fund - generate ID
          fundId = `fund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
      } else {
        // Modern: ID-based call
        fundId = fundIdentifier;
      }

      if (!fundId) throw new Error('Fund ID could not be determined');

      let result;
      
      if (updatedFund === null) {
        // Delete fund
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/user/${userId}/retirement_fund/${fundId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to delete fund');
        result = await response.json();
        
        // Update local state by removing the fund
        setUserData(prevData => ({
          ...prevData,
          retirement_funds: prevData.retirement_funds.filter(f => f.id !== fundId)
        }));
        
      } else {
        // Create or update fund
        const fundData = { ...updatedFund, id: fundId };
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/user/${userId}/retirement_fund/${fundId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fundData)
        });
        if (!response.ok) throw new Error('Backend sync failed');
        result = await response.json();
        
        // Update local state with the returned fund (includes calculated projections)
        if (result.fund) {
          setUserData(prevData => {
            const existingFunds = prevData.retirement_funds || [];
            const fundIndex = existingFunds.findIndex(f => f.id === fundId);
            
            if (fundIndex >= 0) {
              // Update existing fund
              const updatedFunds = [...existingFunds];
              updatedFunds[fundIndex] = { ...updatedFunds[fundIndex], ...result.fund, id: fundId };
              return { ...prevData, retirement_funds: updatedFunds };
            } else {
              // Add new fund
              return { ...prevData, retirement_funds: [...existingFunds, { ...result.fund, id: fundId }] };
            }
          });
        }
      }

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
      const currentFunds = userData?.retirement_funds || [];
      const fund = currentFunds.find(f => f.id === fundId);
      
      if (!fund) {
        throw new Error('Fund not found');
      }

      let updatedActualData = [...(fund.actual_data || [])];
      
      // If all values are null, remove the entry
      if (actualBalance === null && actualContributions === null && actualGrowth === null) {
        updatedActualData = updatedActualData.filter(data => parseInt(data.year) !== parseInt(year));
      } else {
        // Remove existing entry for this year
        updatedActualData = updatedActualData.filter(data => parseInt(data.year) !== parseInt(year));
        
        // Add new entry
        const newActualData = { 
          year: parseInt(year), 
          actual_balance: parseFloat(actualBalance),
          actual_contributions: parseFloat(actualContributions),
          actual_growth: parseFloat(actualGrowth)
        };
        updatedActualData.push(newActualData);
      }

      // Sync with backend and update local state
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const userId = userData?.user?.id;
        if (!userId) throw new Error('User ID not available');
        
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/user/${userId}/retirement_fund/${fundId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actual_data: updatedActualData })
        });
        if (!response.ok) throw new Error('Backend sync failed');
        
        const result = await response.json();
        
        // Update local state with the returned fund (includes updated projections)
        if (result.fund) {
          setUserData(prevData => {
            const existingFunds = prevData.retirement_funds || [];
            const fundIndex = existingFunds.findIndex(f => f.id === fundId);
            
            if (fundIndex >= 0) {
              const updatedFunds = [...existingFunds];
              updatedFunds[fundIndex] = { ...updatedFunds[fundIndex], ...result.fund };
              return { ...prevData, retirement_funds: updatedFunds };
            }
            return prevData;
          });
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateFamilyInfoData = async (memberIndex, updatedMember) => {
    setLoading(true);
    setError(null);

    try {
      const familyId = userData?.user?.family_id;
      if (!familyId) throw new Error('Family ID not available');

      let updatedFamilyData = [...(userData?.family_info || [])];

      if (updatedMember === null) {
        // Delete member
        updatedFamilyData = updatedFamilyData.filter((_, index) => index !== memberIndex);
      } else if (memberIndex < updatedFamilyData.length) {
        // Update existing member
        updatedFamilyData[memberIndex] = { ...updatedFamilyData[memberIndex], ...updatedMember };
      } else {
        // Add new member
        updatedFamilyData.push(updatedMember);
      }

      // Sync with backend
      if (process.env.REACT_APP_BACKEND_API_URL) {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/family_info/${familyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ family_data: updatedFamilyData })
        });
        
        if (!response.ok) throw new Error('Backend sync failed');
        
        const result = await response.json();
        
        // Update local state with the returned family data
        if (result.family) {
          setUserData(prevData => ({
            ...prevData,
            family_info: result.family
          }));
        }
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch using new optimized flow
  useEffect(() => {
    fetchUserData(); // This fetches all user data or creates defaults if needed
  }, []);

  const householdProjection = useMemo(() => {
    if (!userData?.retirement_funds || !userData?.family_info) return { data: [], legendMap: {} };
    
    const yearData = {};
    const legendMap = {};
    
    userData.retirement_funds.forEach((fund, fundIndex) => {
      if (fund.retirement_projection) {
        const member = userData.family_info.find(m => m.id === fund['family_member_id']);
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
  }, [userData]);

  return (
    <RetirementContext.Provider value={{ 
      userData,
      fetchUserData,
      updateRetirementFund, // Legacy index-based
      updateFamilyInfoData,
      updateActualBalance,
      householdProjection,
      loading, 
      error
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);