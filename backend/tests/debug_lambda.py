#!/usr/bin/env python3
"""Debug Lambda functions locally with breakpoints"""

import sys
import os
import json

# Add layers to Python path (go up one level from tests folder)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'layers', 'shared', 'python'))

# Import handlers using importlib for hyphenated folders
import importlib.util

# Load health handler (go up one level from tests folder)
health_spec = importlib.util.spec_from_file_location(
    "health_handler", 
    os.path.join(os.path.dirname(__file__), '..', 'functions', 'health', 'handler.py')
)
health_module = importlib.util.module_from_spec(health_spec)
health_spec.loader.exec_module(health_module)
health_handler = health_module.lambda_handler

# Load retirement data handler (go up one level from tests folder)
retirement_spec = importlib.util.spec_from_file_location(
    "retirement_handler", 
    os.path.join(os.path.dirname(__file__), '..', 'functions', 'get-retirement-data', 'handler.py')
)

retirement_module = importlib.util.module_from_spec(retirement_spec)
retirement_spec.loader.exec_module(retirement_module)
retirement_handler = retirement_module.lambda_handler

def debug_health():
    """Debug health function"""
    event = {}
    context = {}
    
    # Set breakpoint here
    result = health_handler(event, context)
    print("Health result:", json.dumps(result, indent=2))

def debug_retirement_data():
    """Debug retirement data function"""
    event = {
        'pathParameters': {
            'user_id': 'test-user-123'
        }
    }
    context = {}
    
    # Set breakpoint here
    result = retirement_handler(event, context)
    print("Retirement data result:", json.dumps(result, indent=2))

if __name__ == "__main__":
    print("Debugging Lambda functions...")
    
    # Choose which function to debug
    debug_health()
    debug_retirement_data()