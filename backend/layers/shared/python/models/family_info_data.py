# Data model for family information

class FamilyInfoData:
    # Model for family info parameters
    def __init__(self, data):
        self.family_member_data = data.get('family_member_data', [])
    
    def validate(self):
        """
        Validate and normalize family info parameters
        
        Returns:
            tuple: (is_valid, error_message)
        """
        # need to validate the list of family members
        for member in self.family_member_data:
            name = member.get('name', '')
            date_of_birth = member.get('date_of_birth', '')
            
            # Convert and normalize numeric fields
            try:
                member['life_expectancy'] = int(member.get('life_expectancy', 0))
                member['retirement_age'] = int(member.get('retirement_age', 0))
            except (ValueError, TypeError):
                return False, "Life expectancy and retirement age must be valid numbers"
            
            if name is not None and len(name) < 1:
                return False, "Name must be at least 1 character long"
                    
            if not date_of_birth:
                return False, "Date of birth is required"
            
            if member['life_expectancy'] < 50 or member['life_expectancy'] > 120:
                return False, "Life expectancy must be between 50 and 120"
            
            if member['retirement_age'] < 50 or member['retirement_age'] > 80:
                return False, "Retirement age must be between 50 and 80"
                            
        return True, ""
    
    def to_dict(self):
        """
        Convert model to dictionary
        
        Returns:
            dict: Dictionary representation of the model
        """
        return {
            'family_member_data': self.family_member_data,
        }