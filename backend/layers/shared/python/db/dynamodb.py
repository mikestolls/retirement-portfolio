"""
DynamoDB database connection and operations
"""
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

# Global DynamoDB client for connection reuse
_dynamodb_client = None

# Initialize DynamoDB client
def db_get_dynamodb_client():
    """Get DynamoDB client based on environment with connection reuse"""
    global _dynamodb_client
    
    # Reuse existing client if available
    if _dynamodb_client is not None:
        print("Reusing existing DynamoDB client")  # Will show in CloudWatch logs
        return _dynamodb_client
    
    try:        
        # Check if we're running locally (DynamoDB Local)
        endpoint_url = os.environ.get('DYNAMODB_ENDPOINT_URL')
        if endpoint_url:
            # print(f"Connecting to DynamoDB Local at: {endpoint_url}")
            _dynamodb_client = boto3.resource(
                'dynamodb',
                endpoint_url=endpoint_url,
                region_name='us-east-1',
                aws_access_key_id='dummy',
                aws_secret_access_key='dummy'
            )
        else:  # AWS environment
            _dynamodb_client = boto3.resource('dynamodb', region_name=AWS_REGION)
        
        print("Created new DynamoDB client")  # Will show in CloudWatch logs
        return _dynamodb_client
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
                    'Projection': {'ProjectionType': 'KEYS_ONLY'}
                }
            ],
            BillingMode='PAY_PER_REQUEST'
        )

# Simple CRUD operations
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
        
        # Get budgets using same pattern as retirement funds
        budgets_table = dynamodb.Table(BUDGETS_TABLE)
        
        # First, query GSI to get budget IDs
        budgets_response = budgets_table.query(
            IndexName='familyId-index',
            KeyConditionExpression='family_id = :family_id',
            ExpressionAttributeValues={':family_id': family_id}
        )
        budget_ids = [item['budget_id'] for item in budgets_response.get('Items', [])]
        
        # Then batch get complete budget records
        budgets = []
        if budget_ids:
            batch_response = dynamodb.batch_get_item(
                RequestItems={
                    BUDGETS_TABLE: {
                        'Keys': [{'budget_id': budget_id} for budget_id in budget_ids]
                    }
                }
            )
            budgets = batch_response.get('Responses', {}).get(BUDGETS_TABLE, [])
        
        return {
            'user': user,
            'family_info': family_info,
            'retirement_funds': retirement_funds,
            'budgets': budgets
        }
    except Exception as e:
        print(f"Error getting user data: {str(e)}")
        return None

def db_get_family_info(family_id):
    """Get family info by family_id"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(FAMILIES_TABLE)
        response = table.get_item(Key={'family_id': family_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting family info: {str(e)}")
        return None

def db_get_retirement_fund(fund_id):
    """Get retirement fund by fund_id"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(RETIREMENT_FUNDS_TABLE)
        response = table.get_item(Key={'fund_id': fund_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting retirement fund: {str(e)}")
        return None

def db_get_budget(budget_id):
    """Get budget by budget_id"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(BUDGETS_TABLE)
        response = table.get_item(Key={'budget_id': budget_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting budget: {str(e)}")
        return None

def db_update_family_info(family_id, family_member_data):
    """Update family info or create if doesn't exist"""
    try:
        dynamodb = db_get_dynamodb_client()
        table = dynamodb.Table(FAMILIES_TABLE)
        
        family_member_data = convert_floats_to_decimals(family_member_data)
        
        response = table.update_item(
            Key={'family_id': family_id},
            UpdateExpression='SET #data = :data, updated_at = :updated',
            ExpressionAttributeNames={'#data': 'family_member_data'},
            ExpressionAttributeValues={
                ':data': family_member_data,
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
                'family_member_data': family_member_data,
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
        
        # Build update expression dynamically with expression attribute names
        update_expression_parts = []
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        for key, value in fund_data.items():
            if key != 'fund_id':  # Don't update the key
                # Use expression attribute names to handle reserved keywords
                attr_name = f'#{key}'
                attr_value = f':{key}'
                update_expression_parts.append(f'{attr_name} = {attr_value}')
                expression_attribute_names[attr_name] = key
                expression_attribute_values[attr_value] = value
        
        update_expression_parts.append('#updated_at = :updated')
        expression_attribute_names['#updated_at'] = 'updated_at'
        expression_attribute_values[':updated'] = datetime.now().isoformat()
        
        response = table.update_item(
            Key={'fund_id': fund_id},
            UpdateExpression='SET ' + ', '.join(update_expression_parts),
            ExpressionAttributeNames=expression_attribute_names,
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
    """Delete a retirement fund from the retirement_funds table"""
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
