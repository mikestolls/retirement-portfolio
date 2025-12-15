#!/usr/bin/env python3
"""
AWS DynamoDB Table Purge Script
Safely clears all data from DynamoDB tables with confirmations
"""

import boto3
import sys
import time
import argparse
from botocore.exceptions import ClientError

# Table names from your application
TABLES = [
    'users',
    'families', 
    'retirement_funds',
    'budgets'
]

# Global session for reuse
aws_session = None

def init_aws_session(profile_name=None):
    """Initialize AWS session with optional profile"""
    global aws_session
    try:
        if profile_name:
            aws_session = boto3.Session(profile_name=profile_name)
        else:
            aws_session = boto3.Session()
    except Exception as e:
        print(f"❌ Failed to initialize AWS session: {str(e)}")
        if profile_name:
            print(f"Make sure the profile '{profile_name}' exists in your AWS credentials.")
        sys.exit(1)

def get_table_count(table_name):
    """Get approximate item count for a table"""
    try:
        dynamodb = aws_session.client('dynamodb')
        response = dynamodb.describe_table(TableName=table_name)
        return response['Table']['ItemCount']
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"⚠️  Table '{table_name}' does not exist")
            return 0
        else:
            raise e

def scan_and_delete_items(table_name, batch_size=25):
    """Scan table and delete all items in batches"""
    dynamodb = aws_session.resource('dynamodb')
    table = dynamodb.Table(table_name)
    
    deleted_count = 0
    
    try:
        # Get table key schema to know which attributes are keys
        key_names = [key['AttributeName'] for key in table.key_schema]
        
        print(f"🔍 Scanning {table_name}...")
        
        # Scan and delete in batches
        while True:
            # Scan for items (limit to batch size)
            response = table.scan(
                Limit=batch_size,
                ProjectionExpression=','.join(key_names)  # Only get key attributes
            )
            
            items = response.get('Items', [])
            
            if not items:
                break
                
            # Prepare batch delete requests
            delete_requests = []
            for item in items:
                # Extract only the key attributes and convert to DynamoDB format
                key = {}
                for attr in key_names:
                    if attr in item:
                        value = item[attr]
                        # Convert Python types to DynamoDB JSON format
                        if isinstance(value, str):
                            key[attr] = {'S': value}
                        elif isinstance(value, (int, float)):
                            key[attr] = {'N': str(value)}
                        elif isinstance(value, bool):
                            key[attr] = {'BOOL': value}
                        # Add more type conversions as needed
                
                delete_requests.append({
                    'DeleteRequest': {
                        'Key': key
                    }
                })
            
            # Execute batch delete
            if delete_requests:
                dynamodb_client = aws_session.client('dynamodb')
                
                # Split into chunks of 25 (DynamoDB batch limit)
                for i in range(0, len(delete_requests), 25):
                    chunk = delete_requests[i:i+25]
                    
                    response = dynamodb_client.batch_write_item(
                        RequestItems={
                            table_name: chunk
                        }
                    )
                    
                    deleted_count += len(chunk)
                    print(f"   Deleted {deleted_count} items from {table_name}...")
                    
                    # Handle unprocessed items (rare, but good practice)
                    if response.get('UnprocessedItems'):
                        print(f"   Some items were unprocessed, retrying...")
                        time.sleep(1)  # Brief delay before retry
                    
                    # Small delay to avoid throttling
                    time.sleep(0.1)
            
            # Continue if there are more items
            if 'LastEvaluatedKey' not in response:
                break
                
    except Exception as e:
        print(f"❌ Error deleting from {table_name}: {str(e)}")
        return deleted_count
    
    return deleted_count

def list_tables():
    """List all tables and their item counts"""
    print("\n📊 Current DynamoDB Tables:")
    print("-" * 40)
    
    total_items = 0
    existing_tables = []
    
    for table_name in TABLES:
        count = get_table_count(table_name)
        if count >= 0:  # Table exists
            existing_tables.append(table_name)
            total_items += count
            status = "✅" if count > 0 else "📭"
            print(f"{status} {table_name}: {count:,} items")
    
    print("-" * 40)
    print(f"Total items across all tables: {total_items:,}")
    
    return existing_tables, total_items

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Safely purge AWS DynamoDB tables')
    parser.add_argument('--profile', help='AWS profile name to use')
    args = parser.parse_args()
    
    print("🗑️  AWS DynamoDB Table Purge Tool")
    print("=" * 50)
    
    # Initialize AWS session with optional profile
    init_aws_session(args.profile)
    if args.profile:
        print(f"🔧 Using AWS profile: {args.profile}")
    
    # Check AWS credentials
    try:
        sts = aws_session.client('sts')
        identity = sts.get_caller_identity()
        print(f"🔐 AWS Account: {identity['Account']}")
        print(f"🔐 AWS User: {identity.get('Arn', 'Unknown')}")
        print()
    except Exception as e:
        print(f"❌ AWS credentials error: {str(e)}")
        print("Make sure you have valid AWS credentials configured.")
        if args.profile:
            print(f"Check that the profile '{args.profile}' exists and is properly configured.")
        sys.exit(1)
    
    # List current tables
    existing_tables, total_items = list_tables()
    
    if not existing_tables:
        print("🎉 No tables found or all tables are already empty!")
        sys.exit(0)
    
    if total_items == 0:
        print("🎉 All tables are already empty!")
        sys.exit(0)
    
    # Safety confirmations
    print(f"\n⚠️  WARNING: This will DELETE ALL DATA from {len(existing_tables)} tables!")
    print(f"⚠️  Total items to be deleted: {total_items:,}")
    print()
    
    # First confirmation
    confirm1 = input("Are you sure you want to proceed? (type 'DELETE' to confirm): ")
    if confirm1 != 'DELETE':
        print("❌ Operation cancelled.")
        sys.exit(0)
    
    # Second confirmation with table names
    print(f"\n📋 Tables to be purged:")
    for table in existing_tables:
        print(f"   - {table}")
    
    confirm2 = input(f"\nType the word 'PURGE' to confirm deletion of {total_items:,} items: ")
    if confirm2 != 'PURGE':
        print("❌ Operation cancelled.")
        sys.exit(0)
    
    # Execute purge
    print(f"\n🚀 Starting purge of {len(existing_tables)} tables...")
    print("-" * 50)
    
    total_deleted = 0
    start_time = time.time()
    
    for table_name in existing_tables:
        print(f"\n🗑️  Purging {table_name}...")
        deleted = scan_and_delete_items(table_name)
        total_deleted += deleted
        print(f"✅ Completed {table_name}: {deleted:,} items deleted")
    
    # Summary
    elapsed_time = time.time() - start_time
    print("\n" + "=" * 50)
    print(f"🎉 Purge completed!")
    print(f"📊 Total items deleted: {total_deleted:,}")
    print(f"⏱️  Time elapsed: {elapsed_time:.2f} seconds")
    print(f"🚀 Throughput: {total_deleted/elapsed_time:.1f} items/second")

if __name__ == "__main__":
    main()