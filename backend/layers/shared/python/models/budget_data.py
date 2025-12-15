# Data model for budget information

class BudgetData:
    # Model for single budget structure matching frontend
    def __init__(self, data):
        # Flatten the structure - no need for budget_data wrapper
        self.name = data.get('name', '')
        self.totalIncome = data.get('totalIncome', 0)
        self.expenses = data.get('expenses', [])
        self.categories = data.get('categories', [])
        self.family_id = data.get('family_id', '')
    
    def validate(self):
        """
        Validate budget data structure
        
        Returns:
            tuple: (is_valid, error_message)
        """
        # Validate family_id
        if not self.family_id or len(str(self.family_id).strip()) == 0:
            return False, "Family ID is required"
        
        # Validate budget name
        if not self.name or len(str(self.name).strip()) == 0:
            return False, "Budget must have a name"
        
        # Validate total income
        if not isinstance(self.totalIncome, (int, float)) or self.totalIncome < 0:
            return False, "Total income must be non-negative"
        
        # Validate expenses array
        if not isinstance(self.expenses, list):
            return False, "Expenses must be an array"
        
        # Validate each expense
        for expense_index, expense in enumerate(self.expenses):
            if not isinstance(expense, dict):
                return False, f"Expense {expense_index} must be an object"
            
            expense_id = expense.get('id')
            expense_name = expense.get('expense', '')
            category = expense.get('category', '')
            amount = expense.get('amount', 0)
            
            # Validate expense ID
            if not expense_id:
                return False, f"Expense {expense_index} must have an ID"
            
            # Validate expense name
            if not isinstance(expense_name, str):
                return False, f"Expense {expense_index} name must be a string"
            
            # Validate category
            if not isinstance(category, str) or len(category.strip()) == 0:
                return False, f"Expense '{expense_name}' must have a category"
            
            # Validate amount
            if not isinstance(amount, (int, float)) or amount < 0:
                return False, f"Expense '{expense_name}' amount must be non-negative"
        
        # Validate categories array
        if not isinstance(self.categories, list):
            return False, "Categories must be an array"
        
        # Validate each category
        for category_index, category in enumerate(self.categories):
            if not isinstance(category, str) or len(category.strip()) == 0:
                return False, f"Category {category_index} must be a non-empty string"
        
        return True, ""
    
    def to_dict(self):
        """Convert to dictionary format for database storage"""
        return {
            'name': self.name,
            'totalIncome': self.totalIncome,
            'expenses': self.expenses,
            'categories': self.categories,
            'family_id': self.family_id
        }
