import json
import logging
from datetime import datetime
from db.dynamodb import db_update_budget, db_create_tables_if_not_exist
from models.budget_data import BudgetData
from utils.handler_utils import (
    create_error_response, 
    process_crud_request, 
    generate_uuid
)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Budget handler supporting both create and update"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get budget ID from path parameters (None for create operations)
        budget_id = event.get('pathParameters', {}).get('budget_id')
        
        # Handle POST request for both create and update
        if event.get('httpMethod') == 'POST':
            if budget_id:
                # Update existing budget
                return handle_update_budget(event, budget_id)
            else:
                # Create new budget
                return handle_create_budget(event)
        
        return create_error_response(405, "Method not allowed")
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def handle_create_budget(event):
    """Handle POST requests to create a new budget"""
    # Generate new budget ID
    budget_id = generate_uuid()
    
    # Data transformation function to wrap budget data
    def transform_budget_data(input_data, resource_id):
        return {'budget_data': input_data}
    
    return process_crud_request(
        event=event,
        resource_id=budget_id,
        model_class=BudgetData,
        db_function=db_update_budget,
        success_message='Budget created successfully',
        status_code=201,
        data_key='budget_data',
        data_transform=transform_budget_data
    )

def handle_update_budget(event, budget_id):
    """Handle POST requests to update existing budget"""
    # Data transformation function to wrap budget data
    def transform_budget_data(input_data, resource_id):
        return {'budget_data': input_data}
    
    return process_crud_request(
        event=event,
        resource_id=budget_id,
        model_class=BudgetData,
        db_function=db_update_budget,
        success_message='Budget updated successfully',
        status_code=200,
        data_key='budget_data',
        data_transform=transform_budget_data
    )