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
            date_of_birth = member.get('date_of_birth', '')
            life_expectancy = int(member.get('life_expectancy', 0))
            retirement_age = int(member.get('retirement_age', 0))
            
            if name is not None and len(name) < 1:
                return False, "Name must be at least 1 character long"
                    
            if not date_of_birth:
                return False, "Date of birth is required"
            
            if life_expectancy < 50 or life_expectancy > 120:
                return False, "Life expectancy must be between 50 and 120"
            
            if retirement_age < 50 or retirement_age > 80:
                return False, "Retirement age must be between 50 and 80"
                            
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