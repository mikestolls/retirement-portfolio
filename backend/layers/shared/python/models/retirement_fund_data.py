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
            family_member_id = fund.get('family-member-id', '')
            initial_investment = float(fund.get('initial-investment', 0))
            regular_contribution = float(fund.get('regular-contribution', 0))
            contribution_frequency = int(fund.get('contribution-frequency', 0))
            
            # Convert return rate params to ensure numeric types
            return_rate_params = fund.get('return-rate-params', [])
            if return_rate_params:
                for param in return_rate_params:
                    param['fromAge'] = int(param.get('fromAge', 0))
                    param['toAge'] = int(param.get('toAge', 0))
                    param['returnRate'] = float(param.get('returnRate', 0.0))

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