import json
import logging
from db.dynamodb import db_create_tables_if_not_exist, db_get_dynamodb_client, USERS_TABLE

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Get just user data from users table"""
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
        
        # Get user from users table only
        dynamodb = db_get_dynamodb_client()
        user_table = dynamodb.Table(USERS_TABLE)
        user_response = user_table.get_item(Key={'user_id': user_id})
        user = user_response.get('Item')
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "User not found", "status": "error"})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'user': user,
                'status': 'success'
            }, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }
