import json
from datetime import datetime
from db.dynamodb import db_update_budget, db_get_budget, db_delete_budget
from models.budget_data import BudgetData
from utils.handler_utils import (
    create_error_response, 
    create_success_response,
    process_crud_request, 
    process_get_request,
    generate_uuid
)
from utils.logging_config import setup_lambda_logging

# Configure logging
logger = setup_lambda_logging()

def lambda_handler(event, context):
    """Budget handler supporting create, update, and delete"""
    try:
        # Get budget ID from path parameters (None for create operations)
        path_parameters = event.get('pathParameters') or {}
        budget_id = path_parameters.get('budget_id') if path_parameters else None
        
        # Handle POST request for both create and update
        if event.get('httpMethod') == 'POST':
            if budget_id:
                # Update existing budget
                return handle_update_budget(event, budget_id)
            else:
                # Create new budget
                return handle_create_budget(event)
        
        # Handle DELETE request to delete budget
        elif event.get('httpMethod') == 'DELETE':
            if not budget_id:
                return create_error_response(400, "budget_id is required for DELETE")
            return handle_delete_budget(event, budget_id)
        
        # Handle GET request to retrieve budget
        elif event.get('httpMethod') == 'GET':
            if not budget_id:
                return create_error_response(400, "budget_id is required for GET")
            return handle_get_budget(budget_id)
        
        return create_error_response(405, "Method not allowed")
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def handle_create_budget(event):
    """Handle POST requests to create a new budget"""
    # Generate new budget ID
    budget_id = generate_uuid()
    
    return process_crud_request(
        event=event,
        resource_id=budget_id,
        model_class=BudgetData,
        db_function=db_update_budget,
        success_message='Budget created successfully',
        status_code=201,
        id_key='budget_id',
        response_key='budget_info'
    )

def handle_update_budget(event, budget_id):
    """Handle POST requests to update existing budget"""
    return process_crud_request(
        event=event,
        resource_id=budget_id,
        model_class=BudgetData,
        db_function=db_update_budget,
        success_message='Budget updated successfully',
        status_code=200,
        id_key='budget_id',
        response_key='budget_info'
    )

def handle_delete_budget(event, budget_id):
    """Handle DELETE requests to delete a budget"""
    try:
        success = db_delete_budget(budget_id)
        if success:
            return create_success_response(200, "Budget deleted successfully")
        else:
            return create_error_response(404, "Budget not found")
    except Exception as e:
        return create_error_response(500, f"Error deleting budget: {str(e)}")

def handle_get_budget(budget_id):
    """Handle GET requests to retrieve budget info"""
    return process_get_request(
        resource_id=budget_id,
        db_function=db_get_budget,
        response_key='budget_info',
        not_found_message="Budget not found"
    )