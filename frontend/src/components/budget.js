import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Select, MenuItem, FormControl, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Drawer } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useRetirement } from '../context/retirement-context';
import '../css/app.css';

export default function Budget() {
  const { userData, loading, error, updateBudget, getDefaultBudget, globalSaving, setGlobalSaving } = useRetirement();
  
  // Extract data from new structure - direct usage like retirement funds
  const budgets = userData?.budgets || [];
  
  const [selectedBudget, setSelectedBudget] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [addCategoryDialog, setAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingExpenseId, setPendingExpenseId] = useState(null);
  const [budgetFormChanges, setBudgetFormChanges] = useState({});
  
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncomeValue, setTempIncomeValue] = useState('');

  // Get current budget data
  const currentBudget = budgets[selectedBudget];
  const expenses = currentBudget?.expenses || [];
  const categories = currentBudget?.categories || [];
  const totalIncome = currentBudget?.totalIncome || 0;

  const handleSort = (column) => {
    const isAsc = sortBy === column && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(column);
  };

  const sortedAndFilteredExpenses = useMemo(() => {
    let filtered = expenses;
    
    if (categoryFilter) {
      filtered = expenses.filter(item => item.category === categoryFilter);
    }
    
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (sortBy === 'amount') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }
    
    return filtered;
  }, [expenses, sortBy, sortOrder, categoryFilter]);

  const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netPosition = totalIncome - totalExpenses;

  const updateExpense = async (id, field, value) => {
    // Persist to backend - backend will handle userData updates
    if (currentBudget?.budget_id) {
      const updatedBudget = {
        ...currentBudget,
        expenses: currentBudget.expenses.map(item => 
          item.id === id ? { ...item, [field]: value } : item
        )
      };
      
      // Convert to backend format - ensure all expense amounts are numbers
      const backendBudgetData = {
        name: updatedBudget.name,
        totalIncome: parseFloat(updatedBudget.totalIncome) || 0,
        expenses: updatedBudget.expenses.map(expense => ({
          ...expense,
          amount: parseFloat(expense.amount) || 0
        })),
        categories: updatedBudget.categories
      };
      
      await updateBudget(currentBudget.budget_id, backendBudgetData);
    }
  };

  const addExpenseCategory = async () => {
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    const newExpense = { id: newId, expense: '', category: 'Other', amount: 0 };
    
    // Persist to backend - backend will handle userData updates
    if (currentBudget?.budget_id) {
      const updatedBudget = {
        ...currentBudget,
        expenses: [...currentBudget.expenses, newExpense]
      };
      
      // Convert to backend format - ensure all expense amounts are numbers
      const backendBudgetData = {
        name: updatedBudget.name,
        totalIncome: parseFloat(updatedBudget.totalIncome) || 0,
        expenses: updatedBudget.expenses.map(expense => ({
          ...expense,
          amount: parseFloat(expense.amount) || 0
        })),
        categories: updatedBudget.categories
      };
      
      await updateBudget(currentBudget.budget_id, backendBudgetData);
    }
  };

  const handleCategoryChange = (expenseId, value) => {
    if (value === 'ADD_NEW_CATEGORY') {
      setPendingExpenseId(expenseId);
      setAddCategoryDialog(true);
    } else {
      updateExpense(expenseId, 'category', value);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      const newCategory = newCategoryName.trim();
      
      if (pendingExpenseId) {
        updateExpense(pendingExpenseId, 'category', newCategory);
      }

      // Persist to backend (only if not already handled by updateExpense)
      if (currentBudget?.budget_id && !pendingExpenseId) {
        const updatedBudget = {
          ...currentBudget,
          categories: [...currentBudget.categories, newCategory]
        };
        
        // Convert to backend format
        const backendBudgetData = {
          name: updatedBudget.name,
          totalIncome: updatedBudget.totalIncome,
          expenses: updatedBudget.expenses,
          categories: updatedBudget.categories
        };
        
        await updateBudget(currentBudget.budget_id, backendBudgetData);
      }
    }
    setAddCategoryDialog(false);
    setNewCategoryName('');
    setPendingExpenseId(null);
  };

  const handleCancelAddCategory = () => {
    setAddCategoryDialog(false);
    setNewCategoryName('');
    setPendingExpenseId(null);
  };



  const updateTotalIncome = async (newIncome) => {
    const incomeValue = parseFloat(newIncome) || 0;
    
    // Persist to backend - backend will handle userData updates
    if (currentBudget?.budget_id) {
      const updatedBudget = {
        ...currentBudget,
        totalIncome: incomeValue
      };
      
      // Convert to backend format
      const backendBudgetData = {
        name: updatedBudget.name,
        totalIncome: updatedBudget.totalIncome,
        expenses: updatedBudget.expenses,
        categories: updatedBudget.categories
      };
      
      await updateBudget(currentBudget.budget_id, backendBudgetData);
    }
  };

  const handleIncomeEdit = () => {
    setTempIncomeValue(totalIncome.toString());
    setEditingIncome(true);
  };

  const handleIncomeSave = async () => {
    await updateTotalIncome(tempIncomeValue);
    setEditingIncome(false);
  };

  const handleIncomeCancel = () => {
    setEditingIncome(false);
    setTempIncomeValue('');
  };

  const handleEditBudget = (index) => {
    setEditingBudget(index);
    setBudgetFormChanges({}); // Start with no changes
    setDrawerOpen(true);
  };

  const handleAddNewBudget = async () => {
    const familyId = userData.user.family_id;

    if (!familyId) {
      console.error('Missing family_id');
      return;
    }

    // Get default budget data from context
    const newBudget = getDefaultBudget(familyId);

    try {
      // Show saving indicator while adding new budget
      setGlobalSaving(true);
      console.log('Adding new budget...');
      
      // Use null as budgetId to indicate this is a new budget creation
      const success = await updateBudget(null, newBudget);
      
      if (success) {
        console.log('Successfully added new budget');
        // The new budget will be automatically added to the userData by the context
        // Calculate the new index for the drawer
        const newIndex = userData.budgets.length;
        
        // Open drawer to edit the newly created budget
        setEditingBudget(newIndex);
        setBudgetFormChanges({}); // Start with no changes
        setDrawerOpen(true);
      } else {
        console.error('Failed to add budget');
      }
    } catch (error) {
      console.error('Error adding budget:', error);
    } finally {
      // Hide saving indicator
      setGlobalSaving(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = field === 'totalIncome' ? parseFloat(event.target.value) || 0 : event.target.value;
    setBudgetFormChanges(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getBudgetFormData = () => {
    if (editingBudget !== null) {
      return { ...budgets[editingBudget], ...budgetFormChanges };
    }
    return budgetFormChanges;
  };

  const handleDrawerClose = () => {
    // Close drawer immediately for better UX
    setDrawerOpen(false);
    
    // Handle background update if there are changes (like retirement funds)
    if (editingBudget !== null && budgetFormChanges && Object.keys(budgetFormChanges).length > 0) {
      // Update existing budget
      const budget = budgets[editingBudget];
      const budgetId = budget?.budget_id;
      
      if (budgetId) {
        const updateData = {
          ...budget, // Include all original budget data
          ...budgetFormChanges // Override with form changes
        };
        
        // Show saving indicator
        setGlobalSaving(true);
        console.log('Updating budget in background...');
        
        // Update in background
        updateBudget(budgetId, updateData)
          .then((success) => {
            if (success) {
              console.log('Budget updated successfully');
              // Clear form changes after successful update
              setBudgetFormChanges({});
            } else {
              console.error('Budget update failed');
            }
          })
          .catch(error => {
            console.error('Failed to update budget:', error);
          })
          .finally(() => {
            setGlobalSaving(false);
          });
      }
    } else if (editingBudget === null && budgetFormChanges && Object.keys(budgetFormChanges).length > 0 && budgetFormChanges.name?.trim()) {
      // Create new budget only if there are changes and a name
      setGlobalSaving(true);
      console.log('Creating new budget...');
      
      const familyId = userData?.user?.family_id;
      if (familyId) {
        const defaultBudget = getDefaultBudget(familyId);
        const newBudgetData = {
          ...defaultBudget,
          ...budgetFormChanges
        };
        
        updateBudget('new_budget', newBudgetData)
          .then((success) => {
            if (success) {
              console.log('Budget created successfully');
              // Select the new budget
              setTimeout(() => {
                setSelectedBudget(budgets.length);
              }, 100);
              // Clear form changes after successful creation
              setBudgetFormChanges({});
            } else {
              console.error('Budget creation failed');
            }
          })
          .catch(error => {
            console.error('Failed to create budget:', error);
          })
          .finally(() => {
            setGlobalSaving(false);
          });
      }
    }
    
    // Clean up form data
    setEditingBudget(null);
    setBudgetFormChanges({});
  };

  const handleDeleteBudget = async () => {
    if (editingBudget !== null) {
      const budget = budgets[editingBudget];
      const budgetId = budget?.budget_id;
      
      if (budgetId) {
        // Close drawer immediately for better UX
        setDrawerOpen(false);
        setEditingBudget(null);
        setBudgetFormChanges({});
        
        // Reset selected budget if we deleted the current one
        if (selectedBudget >= editingBudget) {
          setSelectedBudget(Math.max(0, selectedBudget - 1));
        }
        
        // Show saving indicator and perform delete operation
        setGlobalSaving(true);
        console.log('Deleting budget...');
        
        try {
          const success = await updateBudget(budgetId, null); // null means delete
          
          if (success) {
            console.log('Budget deleted successfully');
          } else {
            console.error('Budget deletion failed');
          }
        } catch (error) {
          console.error('Failed to delete budget:', error);
        } finally {
          setGlobalSaving(false);
        }
      }
    }
  };

  const renderBudgetCards = () => {
    const budgetCards = budgets.map((budget, index) => (
      <Card 
        className="rounded-2xl shadow-md standard-card card-300 clickable-card"
        key={budget.budget_id}
        onClick={() => setSelectedBudget(index)}
        sx={{ 
          cursor: 'pointer',
          backgroundColor: selectedBudget === index ? 'primary.light' : 'background.paper',
          border: selectedBudget === index ? 2 : 1,
          borderColor: selectedBudget === index ? 'primary.main' : 'divider',
          '&:hover': {
            backgroundColor: selectedBudget === index ? 'primary.light' : undefined
          }
        }}
      >
        <CardContent className="p-4">
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <AccountBalanceWalletIcon sx={{ 
                color: selectedBudget === index ? 'primary.main' : 'inherit' 
              }}/>
              <h3 className="text-sm" style={{ 
                color: selectedBudget === index ? 'var(--mui-palette-primary-main)' : 'inherit' 
              }}>
                {budget.name}
              </h3>
            </Stack>
            <IconButton 
              size="small" 
              onClick={(e) => {
                e.stopPropagation();
                handleEditBudget(index);
              }}
              sx={{ color: selectedBudget === index ? 'primary.main' : 'inherit' }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack direction="column" spacing={0.5} alignItems="left" className="mb-2">
            <p className="text-sm">Income: ${budget.totalIncome.toLocaleString()}</p>
            <p className="text-sm">Expenses: ${budget.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toLocaleString()}</p>
            <p className="text-sm">Items: {budget.expenses.length}</p>
          </Stack>
        </CardContent>
      </Card>
    ));

    const addBudgetCard = (
      <Card 
        className="rounded-2xl shadow-md standard-card card-300 add-card"
        key="add-budget"
        onClick={handleAddNewBudget}
        sx={{ cursor: 'pointer' }}
      >
        <CardContent className="p-4">
          <Stack direction="column" spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: 120 }}>
            <AddIcon sx={{ fontSize: 40, color: '#666' }} />
            <Typography variant="h6" color="textSecondary">
              Add Budget
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );

    return [...budgetCards, addBudgetCard];
  };

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* Budget Selection Cards */}
      <Box
        sx={{ 
          display: 'flex', 
          overflowX: 'auto',
          gap: 2, 
          pb: 2,
        }}
      >
        {renderBudgetCards()}
      </Box>

      {/* Current Budget Content */}
      {currentBudget && (
        <>
          <Box
            sx={{ 
              display: 'flex', 
              overflowX: 'auto',
              gap: 2, 
              pb: 1,
            }}
          >
            {/* Total Income */}
            <Card className="rounded-2xl shadow-md standard-card card-33-percent"> 
              <CardContent sx={{ textAlign: 'center' }}>
                <Stack direction="column" spacing={1} alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" color="text.secondary">
                      Total Income
                    </Typography>
                    {!editingIncome && (
                      <IconButton size="small" onClick={handleIncomeEdit}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  {editingIncome ? (
                    <Stack direction="column" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        type="number"
                        value={tempIncomeValue}
                        onChange={(e) => setTempIncomeValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleIncomeSave();
                          } else if (e.key === 'Escape') {
                            handleIncomeCancel();
                          }
                        }}
                        autoFocus
                        sx={{ '& .MuiInputBase-root': { fontSize: '1.5rem' } }}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={handleIncomeSave} variant="contained">
                          Save
                        </Button>
                        <Button size="small" onClick={handleIncomeCancel}>
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  ) : (
                    <Typography variant="h4" color="primary">
                      ${totalIncome.toLocaleString()}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

        {/* Total Expenses */}
        <Card className="rounded-2xl shadow-md standard-card card-33-percent"> 
          <CardContent sx={{ textAlign: 'center' }}>
            <Stack direction="column" spacing={1} alignItems="center">
              <Typography variant="h6" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="h4" color="error">
                ${totalExpenses.toLocaleString()}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Net Position */}
        <Card className="rounded-2xl shadow-md standard-card card-33-percent"> 
          <CardContent sx={{ textAlign: 'center' }}>
            <Stack direction="column" spacing={1} alignItems="center">
              <Typography variant="h6" color="text.secondary">
                Net Position
              </Typography>
              <Typography 
                variant="h4" 
                color={netPosition >= 0 ? 'success.main' : 'error.main'}
              >
                ${netPosition.toLocaleString()}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box
        sx={{ 
          display: 'flex', 
          overflowX: 'auto',
          gap: 2, 
          pb: 1,
        }}
      >
        {/* Expenses */}
        <Card className="rounded-2xl shadow-md standard-card card-100-percent"> 
        <CardContent sx={{ textAlign: 'Left' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Monthly Expenses
              </Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small" sx={{ '& .MuiTableCell-root': { borderRight: '1px solid #e0e0e0' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '50%', minWidth: 200 }}>
                      <TableSortLabel
                        active={sortBy === 'expense'}
                        direction={sortBy === 'expense' ? sortOrder : 'asc'}
                        onClick={() => handleSort('expense')}
                      >
                        Expense
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: '30%', minWidth: 150 }}>
                      <TableSortLabel
                        active={sortBy === 'category'}
                        direction={sortBy === 'category' ? sortOrder : 'asc'}
                        onClick={() => handleSort('category')}
                      >
                        Category
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ width: '20%', minWidth: 120 }}>
                      <TableSortLabel
                        active={sortBy === 'amount'}
                        direction={sortBy === 'amount' ? sortOrder : 'asc'}
                        onClick={() => handleSort('amount')}
                      >
                        Amount / Month
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedAndFilteredExpenses.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ width: '50%', minWidth: 200 }}>
                        <TextField
                          size="small"
                          value={item.expense}
                          onChange={(e) => updateExpense(item.id, 'expense', e.target.value)}
                          placeholder="Expense name"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell sx={{ width: '30%', minWidth: 150 }}>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={item.category}
                            onChange={(e) => handleCategoryChange(item.id, e.target.value)}
                          >
                            {categories.map((cat) => (
                              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                            <MenuItem value="ADD_NEW_CATEGORY" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                              + Add New Category
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="right" sx={{ width: '20%', minWidth: 120 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateExpense(item.id, 'amount', parseFloat(e.target.value) || 0)}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button onClick={addExpenseCategory} sx={{ mt: 2 }}>
              Add Expense
            </Button>
          </CardContent>
        </Card>
      </Box>
      </>
      )}

      {/* Budget Edit/Add Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerClose}
        disableEnforceFocus={true}
        disableAutoFocus={true}
        disableRestoreFocus={true}
        hideBackdrop={false}
        keepMounted={false}
        ModalProps={{
          disablePortal: true,
          disableScrollLock: false,
        }}
      >
        <Box sx={{ width: 400, p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              {editingBudget !== null ? 'Edit Budget' : 'Add New Budget'}
            </Typography>
            <IconButton onClick={handleDrawerClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          
          <Stack spacing={2}>
            <TextField 
              label="Budget Name" 
              name="name"
              value={getBudgetFormData().name || ''}
              onChange={handleChange('name')}
              fullWidth
            />
            
            <TextField 
              label="Total Income" 
              name="totalIncome"
              type="number"
              value={getBudgetFormData().totalIncome || 0}
              onChange={handleChange('totalIncome')}
              fullWidth
            />
            
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Categories</Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {(getBudgetFormData().categories || []).map((category, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField 
                    size="small"
                    value={category}
                    onChange={(e) => {
                      const currentCategories = getBudgetFormData().categories || [];
                      const newCategories = [...currentCategories];
                      newCategories[index] = e.target.value;
                      setBudgetFormChanges(prev => ({ ...prev, categories: newCategories }));
                    }}
                    fullWidth
                  />
                  <IconButton 
                    size="small" 
                    onClick={() => {
                      const currentCategories = getBudgetFormData().categories || [];
                      const newCategories = currentCategories.filter((_, i) => i !== index);
                      setBudgetFormChanges(prev => ({ ...prev, categories: newCategories }));
                    }}
                    sx={{ ml: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button 
                size="small" 
                onClick={() => {
                  const currentCategories = getBudgetFormData().categories || [];
                  setBudgetFormChanges(prev => ({ 
                    ...prev, 
                    categories: [...currentCategories, 'New Category'] 
                  }));
                }}
                startIcon={<AddIcon />}
              >
                Add Category
              </Button>
            </Box>
            
            {editingBudget !== null && (
              <Button 
                variant="outlined" 
                color="error"
                onClick={handleDeleteBudget}
                fullWidth
                sx={{ mt: 2 }}
              >
                Delete Budget
              </Button>
            )}
          </Stack>
        </Box>
      </Drawer>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryDialog} onClose={handleCancelAddCategory}>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddCategory();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAddCategory}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained" disabled={!newCategoryName.trim()}>
            Add Category
          </Button>
        </DialogActions>
      </Dialog>


    </div>
  );
}