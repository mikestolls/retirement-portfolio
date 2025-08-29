# Utility functions for validation

def validate_numeric_range(value, min_value=None, max_value=None, field_name="Value"):
    """
    Validate that a numeric value is within a specified range
    
    Args:
        value: The numeric value to validate
        min_value: Minimum allowed value (inclusive)
        max_value: Maximum allowed value (inclusive)
        field_name: Name of the field for error messages
        
    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        num_value = float(value)
        
        if min_value is not None and num_value < min_value:
            return False, f"{field_name} must be at least {min_value}"
            
        if max_value is not None and num_value > max_value:
            return False, f"{field_name} must be at most {max_value}"
            
        return True, ""
    except (ValueError, TypeError):
        return False, f"{field_name} must be a valid number"