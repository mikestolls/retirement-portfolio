import json
from db.dynamodb import db_get_dynamodb_client, USERS_TABLE
from utils.logging_config import setup_lambda_logging

# Configure logging
logger = setup_lambda_logging()

def lambda_handler(event, context):
    """Get just user data from users table"""
        
    try:
        # Get user_id from path parameters
        path_parameters = event.get('pathParameters') or {}
        user_id = path_parameters.get('user_id')
        
        if not user_id or user_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "user_id not provided", "status": "error"})
            }
        
        # Get user from users table only
        try:
            dynamodb = db_get_dynamodb_client()
            user_table = dynamodb.Table(USERS_TABLE)
            user_response = user_table.get_item(Key={'user_id': user_id})
            user = user_response.get('Item')
        except Exception as db_error:
            logger.error(f"DynamoDB operation failed: {str(db_error)}")
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": f"Database access error: {str(db_error)}", "status": "error"})
            }
        
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
        import traceback
        logger.error(f"Error in lambda_handler: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }
