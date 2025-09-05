import json
import logging
from db.dynamodb import db_update_retirement_fund_data, db_create_tables_if_not_exist, db_create_user_if_not_exists
from models.retirement_fund_data import RetirementFundData

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Update retirement fund data for a user"""
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
                'body': json.dumps({"message": "user_id parameter is required", "status": "error"})
            }
        
        # Get JSON data from request body
        if not event.get('body'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "No data provided!", "status": "error"})
            }
        
        input_data = json.loads(event['body'])
        
        # Create and validate input model
        retirement_fund_info_data = RetirementFundData(input_data)
        is_valid, error_message = retirement_fund_info_data.validate()
        
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": error_message, "status": "error"})
            }
        
        # Get validated input data
        validated_input = retirement_fund_info_data.to_dict()
        
        # Remove retirement_projection key if it exists (won't be saved to db)
        for fund in validated_input['retirement_fund_data']:
            if 'retirement_projection' in fund:
                del fund['retirement_projection']
        
        success = db_update_retirement_fund_data(user_id, validated_input['retirement_fund_data'])
        
        return {
            'statusCode': 200 if success else 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"status": "success" if success else "error"})
        }
        
    except Exception as e:
        logger.error(f"Error updating retirement data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }