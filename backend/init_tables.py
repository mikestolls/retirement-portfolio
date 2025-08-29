#!/usr/bin/env python3
"""Initialize DynamoDB tables"""

import sys
import os

# Add layers to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'layers', 'shared', 'python'))

from db.dynamodb import db_create_tables_if_not_exist

if __name__ == "__main__":
    print("Creating DynamoDB tables...")
    try:
        db_create_tables_if_not_exist()
        print("✓ Tables created successfully!")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")