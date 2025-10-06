import json
import logging
from db.dynamodb import db_get_dynamodb_client, USERS_TABLE
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Update or create user data"""
    try:
        # Get user_id from path parameters
        user_id = event.get('pathParameters', {}).get('user_id')
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "user_id is required", "status": "error"})
            }
        
        # Parse request body for user data
        if not event.get('body'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Request body is required", "status": "error"})
            }
        
        try:
            user_data = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Invalid JSON in request body", "status": "error"})
            }
        
        # Create user record (upsert)
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(USERS_TABLE)
        
        # Create user item with current timestamp
        user_item = {
            'user_id': user_id,
            'email': user_data.get('email', f'{user_id}@example.com'),
            'family_id': user_data.get('family_id'),
            'updated_at': datetime.now().isoformat()
        }
        
        # Check if user exists to determine if this is create or update
        response = table.get_item(Key={'user_id': user_id})
        is_new_user = 'Item' not in response
        
        if is_new_user:
            user_item['created_at'] = datetime.now().isoformat()
        
        table.put_item(Item=user_item)
        
        return {
            'statusCode': 201 if is_new_user else 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': f'User {"created" if is_new_user else "updated"} successfully',
                'user': user_item,
                'status': 'success'
            }, default=str)
        }
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"Internal server error: {str(e)}", "status": "error"})
        }
