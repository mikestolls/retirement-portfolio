import json
import logging
from db.dynamodb import db_get_user_data, db_create_tables_if_not_exist, db_create_user_if_not_exists
from services.retirement_calculator import calculate_retirement_projection

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Get all user data from 4 tables"""    
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get user_id from path parameters
        user_id = event['pathParameters']['user_id']
        
        # Create user if they don't exist
        db_create_user_if_not_exists(user_id)
        
        if not user_id or user_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "user_id not provided", "status": "error"})
            }
        
        # Get all user data from 4 tables
        user_data = db_get_user_data(user_id)
        if not user_data:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Error retrieving user data", "status": "error"})
            }
        
        # Calculate retirement projections if we have funds and family data
        if user_data['retirement_funds'] and user_data['family_info']:
            for fund in user_data['retirement_funds']:
                calculate_retirement_projection(fund, user_data['family_info'])
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(user_data, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error processing user data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }