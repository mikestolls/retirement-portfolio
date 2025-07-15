"""
DynamoDB database connection and operations
"""
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal
import json

# Get DynamoDB configuration from environment variables
DYNAMODB_ENDPOINT = os.environ.get('DYNAMODB_ENDPOINT')
AWS_REGION = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

# Table names
USERS_TABLE = 'retirement_users'
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
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy',
                aws_session_token='dummy'
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
                    'Projection': {'ProjectionType': 'ALL'},
                    'ProvisionedThroughput': {'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
                }
            ],
            ProvisionedThroughput={'ReadCapacityUnits': 5, 'WriteCapacityUnits': 5}
        )

# Portfolio operations
def convert_floats_to_decimals(obj):
    """
    Convert all float values in a nested dictionary/list to Decimal
    
    Args:
        obj: Dictionary, list, or scalar value
        
    Returns:
        Same structure with floats converted to Decimals
    """
    if isinstance(obj, dict):
        return {k: convert_floats_to_decimals(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimals(i) for i in obj]
    elif isinstance(obj, float):
        return Decimal(str(obj))
    else:
        return obj

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
    portfolio_id = portfolio_data.get('portfolio_id', str(uuid.uuid4()))
    
    # Convert all floats to Decimals for DynamoDB
    input_data = convert_floats_to_decimals(portfolio_data.get('input_data', {}))
    retirement_data = convert_floats_to_decimals(portfolio_data.get('retirement_data', []))
    
    # Prepare item for DynamoDB
    item = {
        'portfolio_id': 'demo-portfolio' if portfolio_id is None else portfolio_id,
        'user_id': user_id,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'name': portfolio_data.get('name', 'My Retirement Portfolio'),
        'input_data': input_data,
        'retirement_data': retirement_data
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
    
    response = table.get_item(Key={'portfolio_id': 'demo-portfolio' if portfolio_id is None else portfolio_id})
    
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