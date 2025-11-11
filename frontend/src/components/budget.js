import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, Stack, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Select, MenuItem, FormControl, TableSortLabel, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import '../css/app.css';

export default function Budget() {
  const [expenses, setExpenses] = useState([
    { id: 1, expense: 'Rent', category: 'Housing', amount: 0 },
    { id: 2, expense: 'Groceries', category: 'Food', amount: 0 },
    { id: 3, expense: 'Gas', category: 'Transportation', amount: 0 },
    { id: 4, expense: 'Electric Bill', category: 'Other', amount: 0 }
  ]);

  const [categories, setCategories] = useState(['Housing', 'Food', 'Transportation', 'Entertainment', 'Subscriptions', 'Internet', 'TV', 'Phone', 'Other']);
  const [addCategoryDialog, setAddCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pendingExpenseId, setPendingExpenseId] = useState(null);
  
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [categoryFilter, setCategoryFilter] = useState('');

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

  // TODO: Pull from family info context
  const totalIncome = 0;
  const totalExpenses = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netPosition = totalIncome - totalExpenses;

  const updateExpense = (id, field, value) => {
    setExpenses(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addExpenseCategory = () => {
    const newId = Math.max(...expenses.map(e => e.id)) + 1;
    setExpenses(prev => [...prev, { id: newId, expense: '', category: 'Other', amount: 0 }]);
  };

  const handleCategoryChange = (expenseId, value) => {
    if (value === 'ADD_NEW_CATEGORY') {
      setPendingExpenseId(expenseId);
      setAddCategoryDialog(true);
    } else {
      updateExpense(expenseId, 'category', value);
    }
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      const newCategory = newCategoryName.trim();
      setCategories(prev => [...prev, newCategory]);
      if (pendingExpenseId) {
        updateExpense(pendingExpenseId, 'category', newCategory);
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

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
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
              <Typography variant="h6" color="text.secondary">
                Total Income
              </Typography>
              <Typography variant="h4" color="primary">
                ${totalIncome.toLocaleString()}
              </Typography>
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