import json
from db.dynamodb import db_get_retirement_fund_info, db_get_family_info, db_create_tables_if_not_exist
from services.retirement_calculator import calculate_retirement_projection

def lambda_handler(event, context):
    """Get retirement fund data for a user"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get user_id from path parameters
        user_id = event['pathParameters']['user_id']
        
        if not user_id or user_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "user_id not provided", "status": "error"})
            }
        
        # Get retirement fund info and family info
        retirement_fund_info = db_get_retirement_fund_info(user_id)
        if not retirement_fund_info:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Retirement fund info not found", "status": "error"})
            }
        
        family_info = db_get_family_info(user_id)
        if not family_info:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Family info not found", "status": "error"})
            }
        
        # Calculate retirement projection with both datasets
        calculate_retirement_projection(retirement_fund_info, family_info)
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(retirement_fund_info, default=str)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }