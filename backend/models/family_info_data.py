# Data model for family information

class FamilyInfoData:
    # Model for family info parameters
    def __init__(self, data):
        self.familyinfo_data = data.get('familyinfo_data', {})
    
    def validate(self):
        """
        Validate family info parameters
        
        Returns:
            tuple: (is_valid, error_message)
        """
        # need to validate the list of family members
        for member in self.familyinfo_data:
            name = member.get('name', '')
            age = int(member.get('age', 0))

            if name is not None and len(name) < 1:
                return False, "Name must be at least 1 character long"
                    
            if age < 0 or age > 150:
                return False, "Age must be between 0 and 150"
                
        return True, ""
    
    def to_dict(self):
        """
        Convert model to dictionary
        
        Returns:
            dict: Dictionary representation of the model
        """
        return {
            'familyinfo_data': self.familyinfo_data,
        }