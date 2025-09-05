# Data model for retirement fund info

class RetirementFundData:
    # Model for retirement fund info parameters
    def __init__(self, data):
        self.retirement_fund_data = data.get('retirement_fund_data', {})
    
    def validate(self):
        """
        Validate retirement fund info parameters
        
        Returns:
            tuple: (is_valid, error_message)
        """
        for fund in self.retirement_fund_data:
            name = fund.get('name', '')
            family_member_id = fund.get('family_member_id', '')
            initial_investment = float(fund.get('initial_investment', 0))
            regular_contribution = float(fund.get('regular_contribution', 0))
            contribution_frequency = int(fund.get('contribution_frequency', 0))
            start_date = fund.get('start_date', '')
            
            # Convert return rate params to ensure numeric types
            return_rate_params = fund.get('return_rate_params', [])
            if return_rate_params:
                for param in return_rate_params:
                    param['from_age'] = int(param.get('from_age', 0))
                    param['to_age'] = int(param.get('to_age', 0))
                    param['return_rate'] = float(param.get('return_rate', 0.0))
            
            # Validate and convert actual_data if present
            actual_data = fund.get('actual_data', [])
            if actual_data:
                for entry in actual_data:
                    entry['year'] = int(entry.get('year'))
                    entry['actual_balance'] = float(entry.get('actual_balance'))
                    entry['actual_contributions'] = float(entry.get('actual_contributions'))
                    entry['actual_growth'] = float(entry.get('actual_growth'))
                    
                    if entry['year'] < 2000 or entry['year'] > 2100:
                        return False, "Actual data year must be a valid year between 2000 and 2100"
                    
                    if entry['actual_balance'] < 0:
                        return False, "Actual balance must be a non-negative number"

            if name is not None and len(name) < 1:
                return False, "Name must be at least 1 character long"
                                                
            if initial_investment < 0:
                return False, "Initial investment must be non-negative"
            
            if regular_contribution < 0:
                return False, "Regular contribution must be non-negative"
            
            if contribution_frequency <= 0:
                return False, "Contribution frequency must be greater than 0"
        
        return True, ""
    
    def to_dict(self):
        """
        Convert model to dictionary
        
        Returns:
            dict: Dictionary representation of the model
        """
        return {
            "retirement_fund_data": self.retirement_fund_data
        }