
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