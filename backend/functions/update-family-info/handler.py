import json
from db.dynamodb import db_save_family_info
from models.family_info_data import FamilyInfoData

def lambda_handler(event, context):
    """Update family info for a user"""
    try:
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
        family_info_data = FamilyInfoData(input_data)
        is_valid, error_message = family_info_data.validate()
        
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": error_message, "status": "error"})
            }
        
        # Get validated input data and save
        validated_input = family_info_data.to_dict()
        saved_id = db_save_family_info(user_id, validated_input)
        
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