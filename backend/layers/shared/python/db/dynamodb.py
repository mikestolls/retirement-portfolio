# DynamoDB database connection and operations

import os
import boto3
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
FAMILIES_TABLE = 'families'
RETIREMENT_FUNDS_TABLE = 'retirement_funds'
BUDGETS_TABLE = 'budgets'

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
    
    
    # Create families table
    if FAMILIES_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=FAMILIES_TABLE,
            KeySchema=[
                {'AttributeName': 'family_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'family_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
    
    # Create retirement funds table with GSI
    if RETIREMENT_FUNDS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=RETIREMENT_FUNDS_TABLE,
            KeySchema=[
                {'AttributeName': 'fund_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'fund_id', 'AttributeType': 'S'},
                {'AttributeName': 'family_id', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'familyId-index',
                    'KeySchema': [
                        {'AttributeName': 'family_id', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'KEYS_ONLY'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
    
    # Create budgets table with GSI
    if BUDGETS_TABLE not in existing_tables:
        dynamodb.create_table(
            TableName=BUDGETS_TABLE,
            KeySchema=[
                {'AttributeName': 'budget_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'budget_id', 'AttributeType': 'S'},
                {'AttributeName': 'family_id', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'familyId-index',
                    'KeySchema': [
                        {'AttributeName': 'family_id', 'KeyType': 'HASH'}
                    ],
                    'Projection': {
                        'ProjectionType': 'INCLUDE',
                        'NonKeyAttributes': ['month', 'year', 'planned_income', 'planned_expenses']
                    }
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )

def db_create_user_if_not_exists(user_id, email=None, family_id=None):
    """Create user if they don't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(USERS_TABLE)
        
        # Check if user exists
        response = table.get_item(Key={'user_id': user_id})
        if response.get('Item'):
            return True  # User already exists
        
        # Create new user
        user_item = {
            'user_id': user_id,
            'email': email or f'{user_id}@example.com',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        if family_id:
            user_item['family_id'] = family_id
            
        table.put_item(Item=user_item)
        return True
    except Exception:
        return False

def db_update_user_family(user_id, family_id):
    """Update user's family_id"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(USERS_TABLE)
        
        table.update_item(
            Key={'user_id': user_id},
            UpdateExpression='SET family_id = :family_id, updated_at = :updated',
            ExpressionAttributeValues={
                ':family_id': family_id,
                ':updated': datetime.now().isoformat()
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



# New 4-table structure operations

def db_get_user_data(user_id):
    """Get all user data from 4 tables"""
    try:
        dynamodb = db_get_dynamodb_client()
        
        # Get user
        user_table = dynamodb.Table(USERS_TABLE)
        user_response = user_table.get_item(Key={'user_id': user_id})
        user = user_response.get('Item')
        
        if not user or not user.get('family_id'):
            return {'user': user, 'family': None, 'funds': [], 'budgets': []}
        
        family_id = user['family_id']
        
        # Get family
        family_table = dynamodb.Table(FAMILIES_TABLE)
        family_response = family_table.get_item(Key={'family_id': family_id})
        family = family_response.get('Item')
        
        # Get retirement funds
        funds_table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
        funds_response = funds_table.query(
            IndexName='familyId-index',
            KeyConditionExpression='family_id = :family_id',
            ExpressionAttributeValues={':family_id': family_id}
        )
        funds = funds_response.get('Items', [])
        
        # Get budgets
        budgets_table = dynamodb.Table(BUDGETS_TABLE)
        budgets_response = budgets_table.query(
            IndexName='familyId-index',
            KeyConditionExpression='family_id = :family_id',
            ExpressionAttributeValues={':family_id': family_id}
        )
        budgets = budgets_response.get('Items', [])
        
        return {
            'user': user,
            'family': family,
            'funds': funds,
            'budgets': budgets
        }
    except Exception as e:
        print(f"Error getting user data: {str(e)}")
        return None

def db_update_family(family_id, family_data):
    """Update family or create if doesn't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(FAMILIES_TABLE)
        
        family_data = convert_floats_to_decimals(family_data)
        
        response = table.update_item(
            Key={'family_id': family_id},
            UpdateExpression='SET #data = :data, updated_at = :updated',
            ExpressionAttributeNames={'#data': 'family_data'},
            ExpressionAttributeValues={
                ':data': family_data,
                ':updated': datetime.now().isoformat()
            },
            ConditionExpression='attribute_exists(family_id)',
            ReturnValues='ALL_NEW'
        )
        return response['Attributes']
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        # Item doesn't exist, create it
        table.put_item(
            Item={
                'family_id': family_id,
                'family_data': family_data,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        )
        return table.get_item(Key={'family_id': family_id})['Item']
    except Exception as e:
        print(f"Error updating family: {str(e)}")
        return None

def db_update_retirement_fund(fund_id, fund_data):
    """Update retirement fund or create if doesn't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
        
        fund_data = convert_floats_to_decimals(fund_data)
        
        response = table.update_item(
            Key={'fund_id': fund_id},
            UpdateExpression='SET fund_data = :data, updated_at = :updated',
            ExpressionAttributeValues={
                ':data': fund_data,
                ':updated': datetime.now().isoformat()
            },
            ConditionExpression='attribute_exists(fund_id)',
            ReturnValues='ALL_NEW'
        )
        return response['Attributes']
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        # Item doesn't exist, create it
        table.put_item(
            Item={
                'fund_id': fund_id,
                'family_id': fund_data.get('family_id'),
                'fund_data': fund_data,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        )
        return table.get_item(Key={'fund_id': fund_id})['Item']
    except Exception as e:
        print(f"Error updating retirement fund: {str(e)}")
        return None

def db_update_budget(budget_id, budget_data):
    """Update budget or create if doesn't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(BUDGETS_TABLE)
        
        budget_data = convert_floats_to_decimals(budget_data)
        
        response = table.update_item(
            Key={'budget_id': budget_id},
            UpdateExpression='SET budget_data = :data, updated_at = :updated',
            ExpressionAttributeValues={
                ':data': budget_data,
                ':updated': datetime.now().isoformat()
            },
            ConditionExpression='attribute_exists(budget_id)',
            ReturnValues='ALL_NEW'
        )
        return response['Attributes']
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        # Item doesn't exist, create it
        table.put_item(
            Item={
                'budget_id': budget_id,
                'family_id': budget_data.get('family_id'),
                'budget_data': budget_data,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        )
        return table.get_item(Key={'budget_id': budget_id})['Item']
    except Exception as e:
        print(f"Error updating budget: {str(e)}")
        return None


