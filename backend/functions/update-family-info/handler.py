import json
import logging
from datetime import datetime
from db.dynamodb import db_update_family_info, db_create_tables_if_not_exist
from models.family_info_data import FamilyInfoData
from utils.handler_utils import (
    create_error_response, 
    process_crud_request, 
    generate_uuid
)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def add_member_ids(family_member_data: list) -> list:
    """Add UUIDs to family members that don't have IDs"""
    for member in family_member_data:
        if not member.get('id'):
            member['id'] = generate_uuid()
    return family_member_data

def lambda_handler(event, context):
    """Family handler supporting both create and update"""
    try:
        # Debug: Log the incoming event
        logger.info(f"Lambda handler received event: {json.dumps(event, default=str)}")
        
        # Ensure tables exist
        db_create_tables_if_not_exist()
        
        # Get family ID from path parameters (None for create operations)
        family_id = event.get('pathParameters', {}).get('family_id')
        logger.info(f"Extracted family_id: {family_id}")
        
        # Handle POST request for both create and update
        if event.get('httpMethod') == 'POST':
            if family_id:
                # Update existing family
                return handle_update_family(event, family_id)
            else:
                # Create new family
                return handle_create_family(event)
        
        return create_error_response(405, "Method not allowed")
        
    except Exception as e:
        logger.error(f"Lambda handler error: {str(e)}")
        return create_error_response(500, f"Internal server error: {str(e)}")

def handle_create_family(event):
    """Handle POST requests to create a new family"""
    # Generate new family ID
    family_id = generate_uuid()
        
    # Data transformation function to add member IDs
    def transform_family_data(input_data, resource_id):
        family_member_data = input_data.get('family_member_data', [])
        family_member_data = add_member_ids(family_member_data)
        return {'family_member_data': family_member_data}
    
    return process_crud_request(
        event=event,
        resource_id=family_id,
        model_class=FamilyInfoData,
        db_function=db_update_family_info,
        success_message='Family created successfully',
        status_code=201,
        data_transform=transform_family_data,
        data_key='family_member_data',
        id_key='family_id',
        response_key='family_data'
    )

def handle_update_family(event, family_id):
    """Handle POST requests to update family info"""
    # Data transformation function to add member IDs for any new members
    def transform_family_data(input_data, resource_id):
        # Frontend sends 'family_member_data'
        family_member_data = input_data.get('family_member_data', [])
        family_member_data = add_member_ids(family_member_data)
        return {'family_member_data': family_member_data}
    
    return process_crud_request(
        event=event,
        resource_id=family_id,
        model_class=FamilyInfoData,
        db_function=db_update_family_info,
        success_message='Family updated successfully',
        status_code=200,
        data_transform=transform_family_data,
        data_key='family_member_data',
        id_key='family_id',
        response_key='family_data'
    )
