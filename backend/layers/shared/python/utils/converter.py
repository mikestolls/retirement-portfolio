
# generic converter functions
from decimal import Decimal

def convert_floats_to_decimals(obj):
    """
    Convert all float values in a nested dictionary/list to Decimal
    
    Args:
        obj: Dictionary, list, or scalar value
        
    Returns:
        Same structure with floats converted to Decimals
    """
    if isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimals(i) for i in obj]
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj

def convert_decimals_to_floats(obj):
    """
    Convert all Decimal values in a nested dictionary/list to float for JSON serialization
    
    Args:
        obj: Dictionary, list, or scalar value
        
    Returns:
        Same structure with Decimals converted to floats
    """
    if isinstance(obj, dict):
        return {k: convert_decimals_to_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_decimals_to_floats(i) for i in obj]
    elif isinstance(obj, Decimal):
        return float(obj)
    else:
        return obj