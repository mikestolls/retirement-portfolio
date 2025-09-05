import json
import logging
from db.dynamodb import db_get_retirement_data, db_create_tables_if_not_exist, db_create_user_if_not_exists
from services.retirement_calculator import calculate_retirement_projection

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Get retirement fund data for a user"""    
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
        
        # Get all retirement data (both fund and family info)
        retirement_data = db_get_retirement_data(user_id)
        if not retirement_data:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Retirement data not found", "status": "error"})
            }
        
        # Calculate retirement projection with both datasets
        calculate_retirement_projection(retirement_data, retirement_data)
        
        # Return the data structure
        response_data = {
            'retirement_fund_data': retirement_data.get('retirement_fund_data', []),
            'family_info_data': retirement_data.get('family_info_data', [])
        }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(response_data, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error processing retirement data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }