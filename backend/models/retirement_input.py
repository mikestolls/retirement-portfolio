# Data models for retirement calculator

class RetirementInput:
    # Model for retirement input parameters
    def __init__(self, data):
        self.initial_investment = data.get('initial_investment', 0)
        self.regular_contribution = data.get('regular_contribution', 0)
        self.contribution_frequency = data.get('contribution_frequency', 12)
        self.age = data.get('age', 0)
        self.retirement_age = data.get('retirement_age', 65)
        self.retirement_withdrawal = data.get('retirement_withdrawal', 4)
        self.retirement_inflation = data.get('retirement_inflation', 2)
    
    def validate(self):
        """
        Validate retirement input parameters
        
        Returns:
            tuple: (is_valid, error_message)
        """
        if self.initial_investment < 0:
            return False, "Initial investment must be non-negative"
        
        if self.regular_contribution < 0:
            return False, "Regular contribution must be non-negative"
        
        if self.age < 0 or self.age > 100:
            return False, "Age must be between 0 and 100"
        
        if self.retirement_age < self.age:
            return False, "Retirement age must be greater than current age"
        
        if self.retirement_age > 100:
            return False, "Retirement age must be less than 100"
        
        if self.retirement_withdrawal < 0 or self.retirement_withdrawal > 20:
            return False, "Withdrawal rate must be between 0 and 20"
        
        if self.retirement_inflation < 0 or self.retirement_inflation > 15:
            return False, "Inflation rate must be between 0 and 15"
        
        return True, ""
    
    def to_dict(self):
        """
        Convert model to dictionary
        
        Returns:
            dict: Dictionary representation of the model
        """
        return {
            'initial_investment': self.initial_investment,
            'regular_contribution': self.regular_contribution,
            'contribution_frequency': self.contribution_frequency,
            'age': self.age,
            'retirement_age': self.retirement_age,
            'retirement_withdrawal': self.retirement_withdrawal,
            'retirement_inflation': self.retirement_inflation
        }