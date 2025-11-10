import json
import time
from db.dynamodb import db_get_user_data
from services.retirement_calculator import calculate_retirement_projection
from utils.logging_config import setup_lambda_logging

# Configure logging
logger = setup_lambda_logging()

def lambda_handler(event, context):
    """Get all user data from 4 tables"""    
    handler_start = time.time()
    logger.info(f"Lambda handler started for user: {event.get('pathParameters', {}).get('user_id', 'unknown')}")
    
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
        
        # Get all user data from 4 tables
        db_start = time.time()
        logger.info("Starting database query for user data")
        user_data = db_get_user_data(user_id)
        db_time = time.time() - db_start
        logger.info(f"Database query completed in {db_time:.3f}s")
        
        if not user_data or not user_data.get('user'):
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "User not found", "status": "error"})
            }
        
        # Calculate retirement projections if we have funds and family data
        calc_start = time.time()
        if user_data.get('retirement_funds') and user_data.get('family_info'):
            logger.info(f"Starting retirement calculations for {len(user_data['retirement_funds'])} funds")
            for fund in user_data['retirement_funds']:
                calculate_retirement_projection(fund, user_data['family_info'])
        calc_time = time.time() - calc_start
        logger.info(f"Retirement calculations completed in {calc_time:.3f}s")
        
        total_time = time.time() - handler_start
        logger.info(f"Lambda handler completed in {total_time:.3f}s (DB: {db_time:.3f}s, Calc: {calc_time:.3f}s)")
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(user_data, default=str)
        }
        
    except Exception as e:
        error_time = time.time() - handler_start
        logger.error(f"Error processing user data after {error_time:.3f}s: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }