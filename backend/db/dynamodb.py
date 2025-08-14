# DynamoDB database connection and operations

import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
import json

from utils.converter import convert_floats_to_decimals

# Get DynamoDB configuration from environment variables
DYNAMODB_ENDPOINT = os.environ.get('DYNAMODB_ENDPOINT_URL')  # Changed to match launch.json
AWS_REGION = os.environ.get('AWS_DEFAULT_REGION')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_SESSION_TOKEN = os.environ.get('AWS_SESSION_TOKEN')

# Table names
USERS_TABLE = 'users'
FAMILY_INFOS_TABLE = 'family_info'
RETIREMENT_FUNDS_TABLE = 'retirement_funds'

# Initialize DynamoDB client
def db_get_dynamodb_client():
    """Get DynamoDB client based on environment"""
    try:        
        if DYNAMODB_ENDPOINT:  # Local development
            # For DynamoDB Local, we need to use dummy credentials
            return boto3.resource(
                'dynamodb',
                endpoint_url=str(DYNAMODB_ENDPOINT),
                region_name=str(AWS_REGION),
                aws_access_key_id=str(AWS_ACCESS_KEY_ID),
                aws_secret_access_key=str(AWS_SECRET_ACCESS_KEY),
                aws_session_token=str(AWS_SESSION_TOKEN) if AWS_SESSION_TOKEN else None
            )
        else:  # AWS environment
            return boto3.resource('dynamodb', region_name=AWS_REGION)
    except Exception as e:
        print(f"Error connecting to DynamoDB: {str(e)}")
        raise

# Initialize tables
def db_create_tables_if_not_exist():
    """Create DynamoDB tables if they don't exist"""
    dynamodb = db_get_dynamodb_client()
    
    # Get existing tables
    existing_tables = [table.name for table in dynamodb.tables.all()]
    
    # Create users table if it doesn't exist. secondary index for email
    if USERS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=USERS_TABLE,
            KeySchema=[
                {
                    'AttributeName': 'user_id',
                    'KeyType': 'HASH'
                },
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'user_id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'email',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'EmailIndex',
                    'KeySchema': [
                        {
                            'AttributeName': 'email',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': { 'ProjectionType': 'ALL' }
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
    
    # Create family info table if it doesn't exist
    if FAMILY_INFOS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=FAMILY_INFOS_TABLE,
            KeySchema=[
                {'AttributeName': 'family_info_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'family_info_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

    # Create retirement fund table if it doesn't exist
    if RETIREMENT_FUNDS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=RETIREMENT_FUNDS_TABLE,
            KeySchema=[
                {'AttributeName': 'retirement_fund_info_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'retirement_fund_info_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

def db_get_user_id(email):
    """
    Get user ID by email
    Args:
        email (str): User email
    Returns:
        str: User ID or None if not found
    """
    dynamodb = db_get_dynamodb_client()
    table = dynamodb.Table(USERS_TABLE)
    
    response = table.query(
        IndexName='EmailIndex',
        KeyConditionExpression='email = :email',
        ExpressionAttributeValues={':email': email}
    )
    
    items = response.get('Items', [])
    return items[0]['user_id'] if items else None

def db_get_family_info(user_id):
    """
    Get family information for a user
    Args:
        user_id (str): User ID
    Returns:
        dict: Family information data or None if not found
    """
    dynamodb = db_get_dynamodb_client()
    
    # Get family_info_id from users table
    users_table = dynamodb.Table(USERS_TABLE)
    user_response = users_table.get_item(Key={'user_id': user_id})
    user_item = user_response.get('Item')
    
    if not user_item or 'family_info_id' not in user_item:
        return None
    
    # Get family info using family_info_id
    family_table = dynamodb.Table(FAMILY_INFOS_TABLE)
    response = family_table.get_item(Key={'family_info_id': user_item['family_info_id']})
    return response.get('Item')

def db_save_family_info(user_id, family_info_data):
    """
    Save family information for a user
    Args:
        user_id (str): User ID
        family_info_data (dict): Family information data
    Returns:
        bool: True if saved successfully, False otherwise
    """
    dynamodb = db_get_dynamodb_client()
    
    # Get existing family_info_id from user
    users_table = dynamodb.Table(USERS_TABLE)
    user_response = users_table.get_item(Key={'user_id': user_id})
    user_item = user_response.get('Item', {})
    
    family_info_id = user_item.get('family_info_id')
    if not family_info_id:
        family_info_id = str(uuid.uuid4())
        # Update user with new family_info_id
        users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET family_info_id = :fid',
            ExpressionAttributeValues={':fid': family_info_id}
        )
    
    # Convert all floats to Decimals for DynamoDB
    family_info_data = convert_floats_to_decimals(family_info_data)
    
    # Save/update family info
    family_table = dynamodb.Table(FAMILY_INFOS_TABLE)
    
    # Check if record exists to preserve created_at
    existing = family_table.get_item(Key={'family_info_id': family_info_id}).get('Item')
    
    family_item = {
        'family_info_id': family_info_id,
        'created_at': existing.get('created_at') if existing else datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        **family_info_data
    }
    
    family_table.put_item(Item=family_item)
    
    return True

def db_get_retirement_fund_info(user_id):
    """
    Get retirement fund information for a user
    Args:
        user_id (str): User ID
    Returns:
        dict: Retirement fund information data or None if not found
    """
    dynamodb = db_get_dynamodb_client()
    
    # Get retirement_fund_info_id from users table
    users_table = dynamodb.Table(USERS_TABLE)
    user_response = users_table.get_item(Key={'user_id': user_id})
    user_item = user_response.get('Item')
    
    if not user_item or 'retirement_fund_info_id' not in user_item:
        return None
    
    # Get retirement fund info using retirement_fund_info_id
    retirement_funds_table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
    response = retirement_funds_table.get_item(Key={'retirement_fund_info_id': user_item['retirement_fund_info_id']})
    return response.get('Item')

def db_save_retirement_fund_info(user_id, retirement_fund_info_data):
    """
    Save retirement fund information for a user
    Args:
        user_id (str): User ID
        retirement_fund_info_data (dict): Retirement fund information data
    Returns:
        bool: True if saved successfully, False otherwise
    """
    dynamodb = db_get_dynamodb_client()
    
    # Get existing retirement_fund_info_id from user
    users_table = dynamodb.Table(USERS_TABLE)
    user_response = users_table.get_item(Key={'user_id': user_id})
    user_item = user_response.get('Item', {})
    
    retirement_fund_info_id = user_item.get('retirement_fund_info_id')
    if not retirement_fund_info_id:
        retirement_fund_info_id = str(uuid.uuid4())
        # Update user with new retirement_fund_info_id
        users_table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET retirement_fund_info_id = :fid',
            ExpressionAttributeValues={':fid': retirement_fund_info_id}
        )
    
    # Convert all floats to Decimals for DynamoDB
    retirement_fund_info_data = convert_floats_to_decimals(retirement_fund_info_data)
    
    # Save/update retirement fund info
    retirement_funds_table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
    
    # Check if record exists to preserve created_at
    existing = retirement_funds_table.get_item(Key={'retirement_fund_info_id': retirement_fund_info_id}).get('Item')
    
    retirement_fund_item = {
        'retirement_fund_info_id': retirement_fund_info_id,
        'created_at': existing.get('created_at') if existing else datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        **retirement_fund_info_data
    }
    
    retirement_funds_table.put_item(Item=retirement_fund_item)
    
    return True
