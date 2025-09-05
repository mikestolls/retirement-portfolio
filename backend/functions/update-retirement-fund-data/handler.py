import json
import logging
from db.dynamodb import db_get_family_info, db_update_single_fund, db_create_tables_if_not_exist, db_create_user_if_not_exists
from services.retirement_calculator import calculate_retirement_projection

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Update a specific retirement fund for a user"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get user_id and fund_id from path parameters
        user_id = event['pathParameters']['user_id']
        fund_id = event['pathParameters']['fund_id']
        
        # Create user if they don't exist
        db_create_user_if_not_exists(user_id)
        
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
        
        # Parse request body
        try:
            fund_data = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Invalid JSON in request body", "status": "error"})
            }
        
        # Update specific fund directly in database
        success = db_update_single_fund(user_id, fund_id, fund_data)
        if not success:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "User or fund not found", "status": "error"})
            }        
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": "Fund updated successfully", "status": "success"})
        }
        
    except Exception as e:
        logger.error(f"Error updating retirement fund: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }