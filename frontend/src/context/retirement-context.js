import React, { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';

const RetirementContext = createContext();

// Default family member template used throughout the app
const DEFAULT_FAMILY_MEMBER = {
  name: 'Stolz',
  date_of_birth: '1986-01-31',
  life_expectancy: 90,
  retirement_age: 65,
};

// Default retirement fund template used throughout the app
const DEFAULT_RETIREMENT_FUND = {
  name: 'Fund',
  initial_investment: 1000,
  regular_contribution: 10,
  contribution_frequency: 12,
  return_rate_params: [],
  contribution_params: [],
  actual_data: []
};

const DEFAULT_BUDGET = {
  name: 'Budget',
  totalIncome: 0,
  expenses: [],
  categories: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Subscriptions', 'Internet', 'TV', 'Phone', 'Other']
};

export const RetirementProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalSaving, setGlobalSaving] = useState(false); // Global saving state for all components
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/users/${user_id}/data`);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else if (response.status === 404) {
        // User doesn't exist, create default data
        console.log('User not found, creating default data...');
        await createDefaultUserData(); // This now sets userData directly
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
      fetchingRef.current.retirement = false;
    }
  };

  const createDefaultUserData = async () => {
    try {
      // Define default data structures (frontend controls structure, backend generates IDs)
      const defaultFamilyMember = DEFAULT_FAMILY_MEMBER;

      // 1. Create family with default member first (no ID in request)
      const familyResponse = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/family_info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_member_data: [defaultFamilyMember] })
      });

      if (!familyResponse.ok) {
        throw new Error(`Failed to create family: ${familyResponse.statusText}`);
      }

      const familyResult = await familyResponse.json();
      const familyId = familyResult.family_info.family_id;
      const memberId = familyResult.family_info.family_member_data[0].id; // Backend generated member ID
      const familyData = familyResult.family_info.family_member_data;

      // 2. Create default retirement fund (references family_id and member_id)
      const defaultFund = {
        ...DEFAULT_RETIREMENT_FUND,
        family_member_id: memberId,
        family_id: familyId,
        start_date: new Date().toISOString().split('T')[0]
      };

      const fundResponse = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/retirement_fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultFund)
      });

      if (!fundResponse.ok) {
        throw new Error(`Failed to create fund: ${fundResponse.statusText}`);
      }

      const fundResult = await fundResponse.json();
      const fundData = fundResult.retirement_fund_info;

      // 3. Create default budget (references family_id)
      const defaultBudget = {
        ...DEFAULT_BUDGET,
        family_id: familyId,
      };

      const budgetResponse = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultBudget)
      });

      if (!budgetResponse.ok) {
        throw new Error(`Failed to create budget: ${budgetResponse.statusText}`);
      }

      const budgetResult = await budgetResponse.json();
      const budgetData = budgetResult.budget_info;

      // 4. Finally, create user record with family_id reference
      const userResponse = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/users/${user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${user_id}@example.com`,
          family_id: familyId
        })
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to create user: ${userResponse.statusText}`);
      }

      const userResult = await userResponse.json();
      const userData = userResult.user || { id: user_id, email: `${user_id}@example.com`, family_id: familyId };

      // Update local state with all the created data (no need to fetch!)
      setUserData({
        user: userData,
        family_info: { family_member_data: familyData },
        retirement_funds: [fundData],
        budgets: [budgetData]
      });

      console.log('Default user data created successfully with backend-generated IDs');
    } catch (error) {
      console.error('Error creating default user data:', error);
      throw error;
    }
  };

  const updateRetirementFund = async (fundId, updatedFund) => {
    setLoading(true);
    setError(null);

    try {
      // Use the static user_id instead of userData?.user?.id
      const userId = user_id;
      if (!userId) throw new Error('User ID not available');

      if (!fundId && updatedFund !== null) {
        // This is a new fund creation case
        fundId = 'new_fund'; // Temporary identifier
      } else if (!fundId) {
        throw new Error('Fund ID could not be determined');
      }

      let result;
      
      if (updatedFund === null) {
        // Delete fund
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/retirement_fund/${fundId}`, {
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
        const familyId = userData?.user?.family_id;
        if (!familyId) throw new Error('Family ID not available');
        
        const fundData = { ...updatedFund, family_id: familyId };
        
        // Check if this is a new fund (no existing ID) or update
        const existingFunds = userData?.retirement_funds || [];
        const existingFund = existingFunds.find(f => f.id === fundId) || fundId === 'new_fund';

        // removing create and update timestamps, and projects
        delete fundData.created_at;
        delete fundData.updated_at;
        delete fundData.retirement_projection;

        let response;
        if (existingFund && fundId !== 'new_fund') {
          // Update existing fund - use ID in path
          response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/retirement_fund/${fundId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fundData)
          });
        } else {
          // Create new fund - no ID in path, backend generates ID
          response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/retirement_fund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fundData)
          });
        }
        
        if (!response.ok) throw new Error('Backend sync failed');
        result = await response.json();
        
        // Use the ID returned from backend (for new funds) or the existing ID
        const returnedFundId = result.retirement_fund_info?.fund_id || fundId;
        const returnedFund = result.retirement_fund_info;
        
        // Update local state with the returned fund (includes calculated projections)
        if (returnedFund) {
          setUserData(prevData => {
            const existingFunds = prevData.retirement_funds || [];
            const fundIndex = existingFunds.findIndex(f => f.id === returnedFundId);
            
            if (fundIndex >= 0) {
              // Update existing fund
              const updatedFunds = [...existingFunds];
              updatedFunds[fundIndex] = { ...updatedFunds[fundIndex], ...returnedFund, id: returnedFundId };
              return { ...prevData, retirement_funds: updatedFunds };
            } else {
              // Add new fund
              return { ...prevData, retirement_funds: [...existingFunds, { ...returnedFund, id: returnedFundId }] };
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
      const familyId = userData?.user?.family_id;
      if (!familyId) throw new Error('Family ID not available');
      
      // Send complete fund object with updated actual_data
      const fundData = { 
        ...fund, 
        actual_data: updatedActualData, 
        family_id: familyId 
      };
      
      // Remove timestamp fields that the backend manages automatically
      delete fundData.created_at;
      delete fundData.updated_at;
      delete fundData.retirement_projection;
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/retirement_fund/${fundId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fundData)
      });
      if (!response.ok) throw new Error('Backend sync failed');
      
      const result = await response.json();
      
      // Update local state with the returned fund (includes updated projections)
      if (result.retirement_fund_info) {
        setUserData(prevData => {
          const existingFunds = prevData.retirement_funds || [];
          const fundIndex = existingFunds.findIndex(f => f.id === fundId);
          
          if (fundIndex >= 0) {
            const updatedFunds = [...existingFunds];
            updatedFunds[fundIndex] = { ...updatedFunds[fundIndex], ...result.retirement_fund_info };
            return { ...prevData, retirement_funds: updatedFunds };
          }
          return prevData;
        });
      }
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFamilyMember = () => ({ ...DEFAULT_FAMILY_MEMBER });

  const getDefaultRetirementFund = (familyMemberId, familyId) => ({
    ...DEFAULT_RETIREMENT_FUND,
    family_member_id: familyMemberId,
    family_id: familyId,
    start_date: new Date().toISOString().split('T')[0]
  });

  const getDefaultBudget = (familyId) => ({
    ...DEFAULT_BUDGET,
    family_id: familyId,
  });

  const updateBudget = async (budgetId, updatedBudget) => {
    setLoading(true);
    setError(null);

    try {
      const userId = user_id;
      if (!userId) throw new Error('User ID not available');

      if (!budgetId && updatedBudget !== null) {
        // This is a new budget creation case
        budgetId = 'new_budget'; // Temporary identifier
      } else if (!budgetId) {
        throw new Error('Budget ID could not be determined');
      }

      let result;
      
      if (updatedBudget === null) {
        // Delete budget
        const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/budget/${budgetId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to delete budget');
        result = await response.json();
        
        // Update local state by removing the budget
        setUserData(prevData => ({
          ...prevData,
          budgets: prevData.budgets.filter(b => b.budget_id !== budgetId)
        }));
        
      } else {
        // Create or update budget
        const familyId = userData?.user?.family_id;
        if (!familyId) throw new Error('Family ID not available');
        
        // Ensure totalIncome is a number (similar to other update functions)
        const budgetData = { 
          ...updatedBudget, 
          family_id: familyId,
          totalIncome: parseInt(updatedBudget.totalIncome) || 0
        };
        
        // Check if this is a new budget (no existing ID) or update
        const existingBudgets = userData?.budgets || [];
        const existingBudget = existingBudgets.find(b => b.budget_id === budgetId) || budgetId === 'new_budget';

        // Remove backend-managed timestamps
        delete budgetData.created_at;
        delete budgetData.updated_at;

        let response;
        if (existingBudget && budgetId !== 'new_budget') {
          // Update existing budget - use ID in path
          response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/budget/${budgetId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetData)
          });
        } else {
          // Create new budget - no ID in path, backend generates ID
          response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/budget`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budgetData)
          });
        }
        
        if (!response.ok) throw new Error('Backend sync failed');
        result = await response.json();
        
        // Use the ID returned from backend (for new budgets) or the existing ID
        const returnedBudgetId = result.budget_info?.budget_id || budgetId;
        const returnedBudget = result.budget_info;
        
        // Update local state with the returned budget
        if (returnedBudget) {
          setUserData(prevData => {
            const existingBudgets = prevData.budgets || [];
            const budgetIndex = existingBudgets.findIndex(b => b.budget_id === returnedBudgetId);
            
            if (budgetIndex >= 0) {
              // Update existing budget
              const updatedBudgets = [...existingBudgets];
              updatedBudgets[budgetIndex] = { ...updatedBudgets[budgetIndex], ...returnedBudget, budget_id: returnedBudgetId };
              return { ...prevData, budgets: updatedBudgets };
            } else {
              // Add new budget
              return { ...prevData, budgets: [...existingBudgets, { ...returnedBudget, budget_id: returnedBudgetId }] };
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

  const updateFamilyInfoData = async (memberIndex, updatedMember) => {
    setLoading(true);
    setError(null);

    try {
      const familyId = userData?.user?.family_id;
      if (!familyId) throw new Error('Family ID not available');

      let updatedFamilyData = [...(userData?.family_info?.family_member_data || [])];

      if (updatedMember === null) {
        // Delete member
        updatedFamilyData = updatedFamilyData.filter((_, index) => index !== memberIndex);
      } else if (memberIndex < updatedFamilyData.length) {
        // Update existing member
        updatedFamilyData[memberIndex] = { ...updatedFamilyData[memberIndex], ...updatedMember };
      } else {
        // Add new member - use defaults if empty object provided
        const memberData = Object.keys(updatedMember).length === 0 ? getDefaultFamilyMember() : updatedMember;
        updatedFamilyData.push({ ...memberData }); // No ID, backend will add it
      }

      // Send entire family data array to simplified backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/family_info/${familyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family_member_data: updatedFamilyData })
      });
      
      if (!response.ok) throw new Error('Backend sync failed');
      
      const result = await response.json();
      
      // Update local state with the returned family data
      if (result.family_info && result.family_info.family_member_data) {
        setUserData(prevData => ({
          ...prevData,
          family_info: { family_member_data: result.family_info.family_member_data }
        }));
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
    if (!userData?.retirement_funds || !userData?.family_info?.family_member_data) return { data: [], legendMap: {} };
    
    const yearData = {};
    const legendMap = {};
    
    userData.retirement_funds.forEach((fund, fundIndex) => {
      if (fund.retirement_projection) {
        const member = userData.family_info.family_member_data.find(m => m.id === fund['family_member_id']);
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
      setUserData,
      fetchUserData,
      updateRetirementFund,
      updateBudget,
      updateFamilyInfoData,
      updateActualBalance,
      getDefaultFamilyMember,
      getDefaultRetirementFund,
      getDefaultBudget,
      householdProjection,
      loading, 
      error,
      globalSaving,
      setGlobalSaving
    }}>
      {children}
    </RetirementContext.Provider>
  );
};

export const useRetirement = () => useContext(RetirementContext);