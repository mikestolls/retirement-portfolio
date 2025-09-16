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

def db_delete_all_tables():
    """Delete all tables - for development only"""
    try:
        dynamodb = db_get_dynamodb_client()
        
        tables_to_delete = [USERS_TABLE, FAMILIES_TABLE, RETIREMENT_FUNDS_TABLE, BUDGETS_TABLE]
        
        for table_name in tables_to_delete:
            try:
                table = dynamodb.Table(table_name)
                table.delete()
                print(f"Deleted table: {table_name}")
                # Wait for table to be deleted
                table.wait_until_not_exists()
            except Exception as e:
                print(f"Error deleting table {table_name}: {e}")
        
        return True
    except Exception as e:
        print(f"Error deleting tables: {str(e)}")
        return False

def db_recreate_retirement_funds_table():
    """Recreate retirement funds table with correct GSI - for development only"""
    try:
        dynamodb = db_get_dynamodb_client()
        
        # Delete retirement funds table
        try:
            table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
            table.delete()
            print(f"Deleted table: {RETIREMENT_FUNDS_TABLE}")
            # Wait for table to be deleted
            table.wait_until_not_exists()
        except Exception as e:
            print(f"Error deleting table {RETIREMENT_FUNDS_TABLE}: {e}")
        
        # Recreate retirement funds table with correct GSI
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
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Recreated table: {RETIREMENT_FUNDS_TABLE}")
        
        return True
    except Exception as e:
        print(f"Error recreating retirement funds table: {str(e)}")
        return False

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
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )

# User operations
def db_create_user_if_not_exists(user_id, email=None):
    """Create user with default data if they don't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(USERS_TABLE)
        
        # Check if user exists
        response = table.get_item(Key={'user_id': user_id})
        if response.get('Item'):
            return True  # User already exists
        
        # Generate IDs for default data
        import uuid
        family_id = str(uuid.uuid4())
        fund_id = str(uuid.uuid4())
        budget_id = str(uuid.uuid4())
        member_id = str(uuid.uuid4())
        
        # Create default family member data
        default_family_data = [{
            'id': member_id,
            'name': 'Stolz',
            'date_of_birth': '1986-01-31',
            'life_expectancy': 90,
            'retirement_age': 65,
        }]
        
        # Create default fund data
        default_fund_data = {
            'id': fund_id,
            'name': 'Fund',
            'family_member_id': member_id,
            'initial_investment': 1000,
            'regular_contribution': 10,
            'contribution_frequency': 12,
            'start_date': datetime.now().strftime('%Y-%m-%d'),
            'return_rate_params': [],
            'contribution_params': [],
            'actual_data': []
        }
        
        # Create default budget data
        default_budget_data = {
            'family_id': family_id,
            'month': datetime.now().month,
            'year': datetime.now().year,
            'planned_income': 5000,
            'planned_expenses': 4000,
            'actual_income': 0,
            'actual_expenses': 0
        }
        
        # Create user record
        user_item = {
            'user_id': user_id,
            'email': email or f'{user_id}@example.com',
            'family_id': family_id,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Create all records atomically
        table.put_item(Item=user_item)
        
        # Create family record
        family_table = dynamodb.Table(FAMILIES_TABLE)
        family_item = {
            'family_id': family_id,
            'family_data': default_family_data,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        family_table.put_item(Item=family_item)
        
        # Create retirement fund record
        funds_table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
        fund_item = {
            'fund_id': fund_id,
            'family_id': family_id,  # Required for GSI
            **default_fund_data,  # Spread fund data at top level
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        funds_table.put_item(Item=fund_item)
        
        # Create budget record
        budgets_table = dynamodb.Table(BUDGETS_TABLE)
        budget_item = {
            'budget_id': budget_id,
            'budget_data': default_budget_data,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        budgets_table.put_item(Item=budget_item)
        
        return True
    except Exception as e:
        print(f"Error creating default user data: {e}")
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


# 4-table structure operations
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
        family_info = family_response.get('Item')
        
        # Get retirement funds using BatchGetItem for efficiency
        funds_table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
        
        # First, query GSI to get fund IDs
        funds_response = funds_table.query(
            IndexName='familyId-index',
            KeyConditionExpression='family_id = :family_id',
            ExpressionAttributeValues={':family_id': family_id}
        )
        fund_ids = [item['fund_id'] for item in funds_response.get('Items', [])]
        
        # Then batch get complete fund records
        retirement_funds = []
        if fund_ids:
            batch_response = dynamodb.batch_get_item(
                RequestItems={
                    RETIREMENT_FUNDS_TABLE: {
                        'Keys': [{'fund_id': fund_id} for fund_id in fund_ids]
                    }
                }
            )
            retirement_funds = batch_response.get('Responses', {}).get(RETIREMENT_FUNDS_TABLE, [])
        
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
            'family_info': family_info,
            'retirement_funds': retirement_funds,
            'budgets': budgets
        }
    except Exception as e:
        print(f"Error getting user data: {str(e)}")
        return None

def db_update_family_info(family_id, family_data):
    """Update family info or create if doesn't exist"""
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
        
        # Build update expression dynamically
        update_expression_parts = []
        expression_attribute_values = {}
        
        for key, value in fund_data.items():
            if key != 'fund_id':  # Don't update the key
                update_expression_parts.append(f'{key} = :{key}')
                expression_attribute_values[f':{key}'] = value
        
        update_expression_parts.append('updated_at = :updated')
        expression_attribute_values[':updated'] = datetime.now().isoformat()
        
        response = table.update_item(
            Key={'fund_id': fund_id},
            UpdateExpression='SET ' + ', '.join(update_expression_parts),
            ExpressionAttributeValues=expression_attribute_values,
            ConditionExpression='attribute_exists(fund_id)',
            ReturnValues='ALL_NEW'
        )
        return response['Attributes']
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        # Item doesn't exist, create it
        item = {
            'fund_id': fund_id,
            **fund_data,  # Spread fund data at top level
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        # Ensure family_id is set for GSI
        if 'family_id' not in item:
            # If family_id is missing, we need to get it from somewhere
            # For now, let's throw an error
            raise ValueError("family_id is required for new retirement fund")
        
        table.put_item(Item=item)
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

def db_delete_retirement_fund(fund_id):
    """
    Delete a retirement fund from the retirement_funds table
    
    Args:
        fund_id (str): ID of the retirement fund to delete
        
    Returns:
        bool: True if deletion was successful, False otherwise
    """
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
        
        # Check if item exists before attempting deletion
        response = table.get_item(Key={'fund_id': fund_id})
        if 'Item' not in response:
            return False
        
        # Delete the item
        table.delete_item(Key={'fund_id': fund_id})
        
        return True
    except Exception as e:
        print(f"Error deleting retirement fund: {str(e)}")
        return False


