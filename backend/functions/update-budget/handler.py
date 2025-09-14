import json
import logging
from db.dynamodb import db_update_budget, db_create_tables_if_not_exist
from models.budget_data import BudgetData

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Update a specific budget"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get budget_id from path parameters
        budget_id = event['pathParameters']['budget_id']
        
        if not budget_id or budget_id.strip() == "":
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "budget_id not provided", "status": "error"})
            }
        
        # Parse request body
        try:
            request_data = json.loads(event['body'])
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Invalid JSON in request body", "status": "error"})
            }
        
        # Validate budget data
        budget_data = BudgetData(request_data)
        is_valid, error_message = budget_data.validate()
        
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": error_message, "status": "error"})
            }
        
        # Get validated input data and save to budgets table
        validated_input = budget_data.to_dict()
        updated_budget = db_update_budget(budget_id, validated_input['budget_data'])
        if not updated_budget:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({"message": "Failed to update budget", "status": "error"})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"budget": updated_budget, "status": "success"}, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error updating budget: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({"message": f"An error occurred: {str(e)}", "status": "error"})
        }