import json
import logging
from db.dynamodb import db_update_retirement_fund, db_create_tables_if_not_exist, db_delete_retirement_fund, db_get_user_data
from services.retirement_calculator import calculate_retirement_projection
from models.retirement_fund_data import RetirementFundData

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Update or delete a specific retirement fund"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get user_id and fund_id from path parameters
        user_id = event['pathParameters']['user_id']
        fund_id = event['pathParameters']['fund_id']
        
        if not user_id or user_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "user_id not provided", "status": "error"})
            }
            
        if not fund_id or fund_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "fund_id not provided", "status": "error"})
            }
        
        # Handle DELETE method
        if event.get('httpMethod') == 'DELETE':
            return handle_delete_fund(user_id, fund_id)
        
        # Handle POST method (update/create)
        return handle_update_fund(event, user_id, fund_id)
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }

def handle_delete_fund(user_id, fund_id):
    """Delete a retirement fund"""
    try:
        # Delete from database
        success = db_delete_retirement_fund(fund_id)
        
        if not success:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Fund not found", "status": "error"})
            }
        
        # Return simple success response for deletion
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': 'Retirement fund deleted successfully',
                'fund_id': fund_id,
                'status': 'success'
            })
        }
        
    except Exception as e:
        logger.error(f"Error deleting fund: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"Error deleting fund: {str(e)}", "status": "error"})
        }

def handle_update_fund(event, user_id, fund_id):
    """Handle POST requests to update/create a retirement fund"""
    # Get JSON data from request body
    if not event.get('body'):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": "No data provided!", "status": "error"})
        }

    # Parse request body
    try:
        input_data = json.loads(event['body'])
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": "Invalid JSON in request body", "status": "error"})
        }

    # Create and validate input model
    # Wrap single fund in array format expected by RetirementFundData
    fund_validation_data = {'retirement_fund_data': [input_data]}
    retirement_fund_data = RetirementFundData(fund_validation_data)
    is_valid, error_message = retirement_fund_data.validate()
    
    if not is_valid:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": error_message, "status": "error"})
        }

    # Get validated input data (extract the single fund from the array)
    validated_fund_data = retirement_fund_data.to_dict()['retirement_fund_data'][0]
    
    # Update fund in retirement_funds table
    updated_fund = db_update_retirement_fund(fund_id, validated_fund_data)
    if not updated_fund:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": "Failed to update fund", "status": "error"})
        }
    
    # Calculate projection for the updated fund with family info
    if updated_fund:
        # Get just the family info for projection calculation
        user_data = db_get_user_data(user_id)
        if user_data and user_data.get('family_info'):
            # Create a temporary fund structure for projection calculation
            fund_for_projection = {
                'fund_data': updated_fund,
                'id': fund_id
            }
            calculate_retirement_projection(fund_for_projection, user_data['family_info'])
            updated_fund = fund_for_projection.get('fund_data', updated_fund)

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'message': 'Retirement fund updated successfully',
            'fund_id': fund_id,
            'fund': updated_fund,
            'status': 'success'
        }, default=str)
    }