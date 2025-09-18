import json
import logging
import uuid
from typing import Dict, Any, Tuple, Optional, Callable

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def parse_request_body(event: Dict[str, Any]) -> Tuple[bool, Optional[Dict], Optional[str]]:
    """
    Parse and validate request body JSON
    
    Returns:
        (success, data, error_message)
    """
    if not event.get('body'):
        return False, None, "No data provided!"
    
    try:
        data = json.loads(event['body'])
        return True, data, None
    except json.JSONDecodeError:
        return False, None, "Invalid JSON in request body"

def validate_data_model(model_class, data: Dict[str, Any]) -> Tuple[bool, Optional[Dict], Optional[str]]:
    """
    Validate data using the provided model class
    
    Returns:
        (is_valid, validated_data, error_message)
    """
    try:
        model_instance = model_class(data)
        is_valid, error_message = model_instance.validate()
        
        if not is_valid:
            return False, None, error_message
            
        validated_data = model_instance.to_dict()
        return True, validated_data, None
        
    except Exception as e:
        return False, None, f"Validation error: {str(e)}"

def create_response(status_code: int, message: str, data: Optional[Dict] = None, 
                   status: str = "success") -> Dict[str, Any]:
    """
    Create standardized API response
    """
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    body = {
        'message': message,
        'status': status
    }
    
    if data:
        body.update(data)
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body, default=str)
    }

def create_success_response(status_code: int, message: str, data: Optional[Dict] = None) -> Dict[str, Any]:
    """Create success response"""
    return create_response(status_code, message, data, "success")

def create_error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Create error response"""
    return create_response(status_code, message, None, "error")

def process_crud_request(
    event: Dict[str, Any],
    resource_id: Optional[str],
    model_class,
    db_function: Callable,
    success_message: str,
    status_code: int = 200,
    data_key: Optional[str] = None,
    data_transform: Optional[Callable] = None,
    id_key: str = 'id',
    response_key: str = 'data'
) -> Dict[str, Any]:
    """
    Generic CRUD request processor
    
    Args:
        event: Lambda event
        resource_id: ID for the resource (None for create, ID for update)
        model_class: Data model class for validation
        db_function: Database function to call
        success_message: Success message for response
        status_code: HTTP status code for success (201 for create, 200 for update)
        data_key: Key to extract from validated data (e.g., 'family_data')
        data_transform: Optional function to transform data before DB call
        id_key: Key to use for the resource ID in response (e.g., 'family_id', 'fund_id')
        response_key: Key to use for the result data in response (e.g., 'family_data', 'data')
    """
    # Parse request body
    success, input_data, error_msg = parse_request_body(event)
    if not success:
        return create_error_response(400, error_msg)
    
    # Apply data transformation if provided
    if data_transform:
        input_data = data_transform(input_data, resource_id)
    
    # Validate data
    is_valid, validated_data, error_msg = validate_data_model(model_class, input_data)
    if not is_valid:
        return create_error_response(400, error_msg)
    
    # Extract specific data if key provided
    db_data = validated_data.get(data_key) if data_key else validated_data
    
    # Call database function
    try:
        result = db_function(resource_id, db_data)
        if not result:
            return create_error_response(500, f"Failed to {'create' if status_code == 201 else 'update'} resource")
        
        # Prepare response data
        response_data = {}
        if resource_id:
            # For create/update operations, include the ID and data
            response_data[id_key] = resource_id
            
        # Include the result data
        response_data[response_key] = result
            
        return create_success_response(status_code, success_message, response_data)
        
    except Exception as e:
        logger.error(f"Database operation error: {str(e)}")
        return create_error_response(500, f"Database error: {str(e)}")

def generate_uuid() -> str:
    """Generate a new UUID string"""
    return str(uuid.uuid4())
