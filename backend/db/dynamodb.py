# DynamoDB database connection and operations

import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
import json

from utils.converter import convert_floats_to_decimals

# Get DynamoDB configuration from environment variables
DYNAMODB_ENDPOINT = os.environ.get('DYNAMODB_ENDPOINT')
AWS_REGION = os.environ.get('AWS_DEFAULT_REGION')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_SESSION_TOKEN = os.environ.get('AWS_SESSION_TOKEN')

# Table names
USERS_TABLE = 'users'
PORTFOLIOS_TABLE = 'retirement_portfolios'

# Initialize DynamoDB client
def get_dynamodb_client():
    """Get DynamoDB client based on environment"""
    try:
        if DYNAMODB_ENDPOINT:  # Local development
            # For DynamoDB Local, we need to use dummy credentials
            return boto3.resource(
                'dynamodb',
                endpoint_url=DYNAMODB_ENDPOINT,
                region_name=AWS_REGION,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                aws_session_token=AWS_SESSION_TOKEN
            )
        else:  # AWS environment
            return boto3.resource('dynamodb', region_name=AWS_REGION)
    except Exception as e:
        print(f"Error connecting to DynamoDB: {str(e)}")
        raise

# Initialize tables
def create_tables_if_not_exist():
    """Create DynamoDB tables if they don't exist"""
    dynamodb = get_dynamodb_client()
    
    # Get existing tables
    existing_tables = [table.name for table in dynamodb.tables.all()]
    
    # Create users table if it doesn't exist
    if USERS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=USERS_TABLE,
            KeySchema=[
                {'AttributeName': 'user_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'user_id', 'AttributeType': 'S'}
            ],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )
    
    # Create portfolios table if it doesn't exist
    if PORTFOLIOS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=PORTFOLIOS_TABLE,
            KeySchema=[
                {'AttributeName': 'portfolio_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'portfolio_id', 'AttributeType': 'S'},
                {'AttributeName': 'user_id', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'UserIdIndex',
                    'KeySchema': [
                        {'AttributeName': 'user_id', 'KeyType': 'HASH'},
                    ],
                    'Projection': {'ProjectionType': 'KEYS_ONLY'},
                    'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
                }
            ],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )

def save_portfolio(user_id, portfolio_data):
    """
    Save retirement portfolio data
    
    Args:
        user_id (str): User ID
        portfolio_data (dict): Portfolio input and calculation data
        
    Returns:
        str: Portfolio ID
    """
    dynamodb = get_dynamodb_client()
    table = dynamodb.Table(PORTFOLIOS_TABLE)
    
    # Generate portfolio ID if not provided
    portfolio_id = portfolio_data.get('portfolio_id')
    
    # Check if item exists
    existing_item = get_portfolio(portfolio_id)
    
    # Set timestamps
    current_time = datetime.now().isoformat()
    if existing_item:
        # Keep original created_at for updates
        created_at = existing_item.get('created_at', current_time)
    else:
        # New item gets current timestamp
        created_at = current_time
        
    # Convert all floats to Decimals for DynamoDB
    input_data = convert_floats_to_decimals(portfolio_data.get('input_data', {}))
    
    # Prepare item for DynamoDB
    item = {
        'portfolio_id': portfolio_id,
        'user_id': user_id,
        'created_at': created_at,
        'updated_at': current_time,
        'input_data': input_data
    }
    
    # Save to DynamoDB
    table.put_item(Item=item)
    
    return portfolio_id

def get_portfolio(portfolio_id):
    """
    Get portfolio by ID
    
    Args:
        portfolio_id (str): Portfolio ID
        
    Returns:
        dict: Portfolio data or None if not found
    """
    dynamodb = get_dynamodb_client()
    table = dynamodb.Table(PORTFOLIOS_TABLE)
    
    response = table.get_item(Key={'portfolio_id': portfolio_id})
    
    return response.get('Item')

def get_user_portfolios(user_id):
    """
    Get all portfolios for a user
    
    Args:
        user_id (str): User ID
        
    Returns:
        list: List of portfolio data
    """
    dynamodb = get_dynamodb_client()
    table = dynamodb.Table(PORTFOLIOS_TABLE)
    
    response = table.query(
        IndexName='UserIdIndex',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id}
    )
    
    return response.get('Items', [])