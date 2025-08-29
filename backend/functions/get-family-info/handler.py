import json
import logging
from db.dynamodb import db_get_family_info, db_create_tables_if_not_exist

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Get family info for a user"""
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
        
        # Get family info from database
        family_info = db_get_family_info(user_id)
        if not family_info:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Family info not found", "status": "error"})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(family_info, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error processing family info data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }