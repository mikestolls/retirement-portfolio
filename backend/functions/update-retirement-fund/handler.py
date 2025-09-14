import json
import logging
from db.dynamodb import db_update_retirement_fund, db_create_tables_if_not_exist, db_create_user_if_not_exists
from services.retirement_calculator import calculate_retirement_projection
from models.retirement_fund_data import RetirementFundData

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Update a specific retirement fund"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get fund_id from path parameters
        fund_id = event['pathParameters']['fund_id']
        
        if not fund_id or fund_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "fund_id not provided", "status": "error"})
            }
        
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
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"fund": updated_fund, "status": "success"}, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error updating retirement fund: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }