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
RETIREMENT_DATA_TABLE = 'retirement_data'

# Initialize DynamoDB client
def db_get_dynamodb_client():
    """Get DynamoDB client based on environment"""
    try:        
        # Check if we're running locally (DynamoDB Local)
        endpoint_url = os.environ.get('DYNAMODB_ENDPOINT_URL')
        if endpoint_url:
            # print(f"Connecting to DynamoDB Local at: {endpoint_url}")
            return boto3.resource(
                'dynamodb',
                endpoint_url=endpoint_url,
                region_name='us-east-1',
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy'
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
    
    # Create consolidated retirement data table if it doesn't exist
    if RETIREMENT_DATA_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=RETIREMENT_DATA_TABLE,
            KeySchema=[
                {'AttributeName': 'user_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'user_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )

def db_create_user_if_not_exists(user_id, email=None):
    """Create user if they don't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(USERS_TABLE)
        
        # Check if user exists
        response = table.get_item(Key={'user_id': user_id})
        if response.get('Item'):
            return True  # User already exists
        
        # Create new user
        table.put_item(
            Item={
                'user_id': user_id,
                'email': email or f'{user_id}@example.com',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        )
        return True
    except Exception:
        return False
    
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

def db_get_retirement_data(user_id):
    """Get consolidated retirement data for a user"""
    dynamodb = db_get_dynamodb_client()
    table = dynamodb.Table(RETIREMENT_DATA_TABLE)
    
    response = table.get_item(Key={'user_id': user_id})
    return response.get('Item')

def db_get_retirement_fund_data(user_id):
    """Get retirement_fund_data portion"""
    dynamodb = db_get_dynamodb_client()
    table = dynamodb.Table(RETIREMENT_DATA_TABLE)
    
    response = table.get_item(
        Key={'user_id': user_id},
        ProjectionExpression='retirement_fund_data'
    )
    item = response.get('Item')
    return item.get('retirement_fund_data') if item else None

def db_update_retirement_fund_data(user_id, retirement_fund_data):
    """Update retirement_fund_data portion"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(RETIREMENT_DATA_TABLE)
        
        retirement_fund_data = convert_floats_to_decimals(retirement_fund_data)
        
        table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET retirement_fund_data = :data, updated_at = :updated',
            ExpressionAttributeValues={
                ':data': retirement_fund_data,
                ':updated': datetime.now().isoformat()
            }
        )
        return True
    except Exception:
        return False

def db_get_family_info(user_id):
    """Get family_info_data portion"""
    dynamodb = db_get_dynamodb_client()
    table = dynamodb.Table(RETIREMENT_DATA_TABLE)
    
    response = table.get_item(
        Key={'user_id': user_id},
        ProjectionExpression='family_info_data'
    )
    item = response.get('Item')
    return item.get('family_info_data') if item else None

def db_update_family_info(user_id, family_info_data):
    """Update family_info_data portion"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(RETIREMENT_DATA_TABLE)
        
        family_info_data = convert_floats_to_decimals(family_info_data)
        
        table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET family_info_data = :data, updated_at = :updated',
            ExpressionAttributeValues={
                ':data': family_info_data,
                ':updated': datetime.now().isoformat()
            }
        )
        return True
    except Exception:
        return False

def db_update_single_fund(user_id, fund_id, fund_data):
    """Update a specific fund without reading first"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(RETIREMENT_DATA_TABLE)
        
        fund_data = convert_floats_to_decimals(fund_data)
        
        # Find fund index by scanning the list
        response = table.get_item(
            Key={'user_id': user_id},
            ProjectionExpression='retirement_fund_data'
        )
        
        if not response.get('Item'):
            return False
        
        funds = response['Item']['retirement_fund_data']
        fund_index = None
        
        for i, fund in enumerate(funds):
            if fund.get('id') == fund_id:
                fund_index = i
                break
        
        if fund_index is None:
            return False
        
        # Update specific fund using list index
        update_expression = f'SET retirement_fund_data[{fund_index}] = :fund_data, updated_at = :updated'
        
        table.update_item(
            Key={'user_id': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues={
                ':fund_data': {**funds[fund_index], **fund_data},
                ':updated': datetime.now().isoformat()
            }
        )
        return True
    except Exception:
        return False


