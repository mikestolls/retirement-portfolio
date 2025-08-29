import json
from db.dynamodb import db_save_retirement_fund_info, db_create_tables_if_not_exist
from models.retirement_fund_data import RetirementFundData

def lambda_handler(event, context):
    """Update retirement fund data for a user"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get user_id from path parameters
        user_id = event['pathParameters']['user_id']
        
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
        
        saved_id = db_save_retirement_fund_info(user_id, validated_input)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(saved_id)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }