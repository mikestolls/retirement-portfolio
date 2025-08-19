# Data model for family information

class FamilyInfoData:
    # Model for family info parameters
    def __init__(self, data):
        self.family_info_data = data.get('family_info_data', {})
    
    def validate(self):
        """
        Validate family info parameters
        
        Returns:
            tuple: (is_valid, error_message)
        """
        # need to validate the list of family members
        for member in self.family_info_data:
            name = member.get('name', '')
            age = int(member.get('age', 0))
            life_expectancy = int(member.get('life-expectancy', 0))
            retirement_age = int(member.get('retirement-age', 0))
            retirement_withdrawal = float(member.get('retirement-withdrawal', 0))
            retirement_inflation = float(member.get('retirement-inflation', 0))
            
            if name is not None and len(name) < 1:
                return False, "Name must be at least 1 character long"
                    
            if age < 0 or age > 150:
                return False, "Age must be between 0 and 150"
            
            if life_expectancy < 0 or life_expectancy > 150:
                return False, "Life expectancy must be between 0 and 150"
            
            if retirement_age < 0 or retirement_age > 150:
                return False, "Retirement age must be between 0 and 150"
            
            if retirement_withdrawal < 0:
                return False, "Retirement withdrawal must be non-negative"
            
            if retirement_inflation < 0:
                return False, "Retirement inflation must be non-negative"
                
        return True, ""
    
    def to_dict(self):
        """
        Convert model to dictionary
        
        Returns:
            dict: Dictionary representation of the model
        """
        return {
            'family_info_data': self.family_info_data,
        }