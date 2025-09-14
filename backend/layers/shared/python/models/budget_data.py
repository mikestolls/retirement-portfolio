# Data model for budget information

class BudgetData:
    # Model for budget parameters
    def __init__(self, data):
        self.budget_data = data.get('budget_data', {})
    
    def validate(self):
        """
        Validate budget parameters
        
        Returns:
            tuple: (is_valid, error_message)
        """
        family_id = self.budget_data.get('family_id', '')
        month = self.budget_data.get('month', 0)
        year = self.budget_data.get('year', 0)
        planned_income = self.budget_data.get('planned_income', 0)
        planned_expenses = self.budget_data.get('planned_expenses', 0)
        actual_income = self.budget_data.get('actual_income', 0)
        actual_expenses = self.budget_data.get('actual_expenses', 0)
        
        # Validate family_id
        if not family_id or len(family_id.strip()) == 0:
            return False, "Family ID is required"
        
        # Validate month (1-12)
        if not isinstance(month, int) or month < 1 or month > 12:
            return False, "Month must be between 1 and 12"
        
        # Validate year
        if not isinstance(year, int) or year < 2000 or year > 2100:
            return False, "Year must be between 2000 and 2100"
        
        # Validate monetary amounts (should be non-negative)
        if planned_income < 0:
            return False, "Planned income cannot be negative"
        
        if planned_expenses < 0:
            return False, "Planned expenses cannot be negative"
        
        if actual_income < 0:
            return False, "Actual income cannot be negative"
        
        if actual_expenses < 0:
            return False, "Actual expenses cannot be negative"
        
        return True, ""
    
    def to_dict(self):
        """Convert to dictionary format for database storage"""
        return {
            'budget_data': self.budget_data
        }
