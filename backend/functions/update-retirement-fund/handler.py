import json
import logging
from datetime import datetime
from db.dynamodb import db_update_retirement_fund, db_get_retirement_fund, db_create_tables_if_not_exist, db_delete_retirement_fund, db_get_family_info
from models.retirement_fund_data import RetirementFundData
from services.retirement_calculator import calculate_retirement_projection
from utils.handler_utils import (
    create_error_response, 
    create_success_response,
    process_crud_request, 
    process_get_request,
    generate_uuid
)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Retirement fund handler supporting create, update, and delete"""
    try:
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get fund ID from path parameters (None for create operations)
        fund_id = event.get('pathParameters', {}).get('fund_id')
        
        # Handle POST request for both create and update
        if event.get('httpMethod') == 'POST':
            if fund_id:
                # Update existing fund
                return handle_update_fund(event, fund_id)
            else:
                # Create new fund
                return handle_create_fund(event)
        
        # Handle DELETE request to delete fund
        elif event.get('httpMethod') == 'DELETE':
            if not fund_id:
                return create_error_response(400, "fund_id is required for DELETE")
            return handle_delete_fund(event, fund_id)
        
        # Handle GET request to retrieve fund
        elif event.get('httpMethod') == 'GET':
            if not fund_id:
                return create_error_response(400, "fund_id is required for GET")
            return handle_get_fund(fund_id)
        
        return create_error_response(405, "Method not allowed")
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def handle_create_fund(event):
    """Handle POST requests to create a new retirement fund"""
    # Generate new fund ID
    fund_id = generate_uuid()
    
    # Data transformation function to add fund ID
    def transform_fund_data(input_data, resource_id):
        input_data['id'] = resource_id
        # Wrap single fund in array format expected by RetirementFundData
        return {'retirement_fund_data': [input_data]}
    
    # Custom database function that includes projection calculation
    def db_function_with_projection(fund_id, fund_data):
        # First, save the fund to database
        result = db_update_retirement_fund(fund_id, fund_data)
        
        if result:
            # Calculate retirement projection
            family_id = fund_data.get('family_id')
            if family_id:
                family_info = db_get_family_info(family_id)
                if family_info:
                    # Pass fund data directly to calculator (projection only for response)
                    calculate_retirement_projection(result, family_info)
        
        return result
    
    return process_crud_request(
        event=event,
        resource_id=fund_id,
        model_class=RetirementFundData,
        db_function=lambda fund_id, data: db_function_with_projection(fund_id, data[0]),  # Extract single fund from array
        success_message='Retirement fund created successfully',
        status_code=201,
        data_key='retirement_fund_data',
        data_transform=transform_fund_data,
        id_key='fund_id',
        response_key='retirement_fund_info'
    )

def handle_delete_fund(event, fund_id):
    """Handle DELETE requests to delete a retirement fund"""
    try:
        success = db_delete_retirement_fund(fund_id)
        if success:
            return create_success_response(200, "Fund deleted successfully")
        else:
            return create_error_response(404, "Fund not found")
    except Exception as e:
        return create_error_response(500, f"Error deleting fund: {str(e)}")

def handle_update_fund(event, fund_id):
    """Handle POST requests to update a retirement fund"""
    # Data transformation function for fund updates
    def transform_fund_data(input_data, resource_id):
        # Wrap single fund in array format expected by RetirementFundData
        return {'retirement_fund_data': [input_data]}
    
    # Custom database function that includes projection calculation
    def db_function_with_projection(fund_id, fund_data):
        # First, save the fund to database
        result = db_update_retirement_fund(fund_id, fund_data)
        
        if result:
            # Calculate retirement projection
            family_id = fund_data.get('family_id')
            if family_id:
                family_info = db_get_family_info(family_id)
                if family_info:
                    # Pass fund data directly to calculator (projection only for response)
                    calculate_retirement_projection(result, family_info)
        
        return result
    
    return process_crud_request(
        event=event,
        resource_id=fund_id,
        model_class=RetirementFundData,
        db_function=lambda fund_id, data: db_function_with_projection(fund_id, data[0]),  # Extract single fund from array
        success_message='Retirement fund updated successfully',
        status_code=200,
        data_key='retirement_fund_data',
        data_transform=transform_fund_data,
        id_key='fund_id',
        response_key='retirement_fund_info'
    )

def handle_get_fund(fund_id):
    """Handle GET requests to retrieve retirement fund info with projections"""
    # Custom database function that includes projection calculation
    def db_function_with_projection(fund_id):
        # First, get the fund from database
        result = db_get_retirement_fund(fund_id)
        
        if result:
            # Calculate retirement projection for response only
            family_id = result.get('family_id')
            if family_id:
                family_info = db_get_family_info(family_id)
                if family_info:
                    # Calculate and add projection to response (not saved to DB)
                    calculate_retirement_projection(result, family_info)
        
        return result
    
    return process_get_request(
        resource_id=fund_id,
        db_function=db_function_with_projection,
        response_key='retirement_fund_info',
        not_found_message="Fund not found"
    )
