#!/usr/bin/env python3
"""Fast development server that wraps Lambda functions"""

import sys
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add layers to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'layers', 'shared', 'python'))

# Now import our logging config
from utils.logging_config import setup_lambda_logging

# Set environment variables
os.environ['DYNAMODB_ENDPOINT_URL'] = 'http://localhost:8000'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
# Set default log level for development (can be overridden)
if 'LOG_LEVEL' not in os.environ:
    os.environ['LOG_LEVEL'] = 'DEBUG'

# Add artificial delay to simulate slower AWS responses (set to 0 to disable)
SIMULATE_DELAY = float(os.getenv('SIMULATE_DELAY', '0'))  # seconds

# Configure logging
logger = setup_lambda_logging()

# Create tables for local development
from db.dynamodb import db_create_tables_if_not_exist
logger.info("Creating DynamoDB tables for local development...")
try:
    db_create_tables_if_not_exist()
    logger.info("DynamoDB tables created/verified successfully")
except Exception as e:
    logger.info(f"Warning: Could not create tables: {e}")
    logger.info("Make sure DynamoDB Local is running on http://localhost:8000")

# Import Lambda handlers
import importlib.util

def load_handler(function_name):
    spec = importlib.util.spec_from_file_location(
        f"{function_name}_handler", 
        os.path.join(os.path.dirname(__file__), 'functions', function_name, 'handler.py')
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.lambda_handler

# Load handlers
health_handler = load_handler('health')
get_user_handler = load_handler('get-user')
get_user_data_handler = load_handler('get-user-data')
update_user_data_handler = load_handler('update-user-data')
update_family_handler = load_handler('update-family-info')
update_fund_handler = load_handler('update-retirement-fund')
update_budget_handler = load_handler('update-budget')

app = Flask(__name__)
CORS(app)

def lambda_to_flask(handler):
    """Convert Lambda handler to Flask route"""
    def wrapper(*args, **kwargs):
        import time
        
        # Simulate AWS Lambda delay if configured
        if SIMULATE_DELAY > 0:
            logger.info(f"Simulating {SIMULATE_DELAY}s delay...")
            time.sleep(SIMULATE_DELAY)
        
        # Build Lambda event from Flask request
        event = {
            'pathParameters': kwargs,
            'queryStringParameters': dict(request.args) if request.args else None,
            'body': request.get_data(as_text=True) if request.data else None,
            'httpMethod': request.method,
            'headers': dict(request.headers),
            'path': request.path  # Add the path for route detection
        }
        
        # For DELETE requests with user_id query param, add it to pathParameters
        if request.method == 'DELETE' and request.args.get('user_id'):
            event['pathParameters']['user_id'] = request.args.get('user_id')
        
        # Call Lambda handler
        response = handler(event, {})
        
        # Return Flask response
        return jsonify(json.loads(response['body'])), response['statusCode']
    
    return wrapper

# Routes
@app.route('/api/health', methods=['GET'])
def health():
    return lambda_to_flask(health_handler)()

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    return lambda_to_flask(get_user_handler)(user_id=user_id)

@app.route('/api/users/<user_id>', methods=['POST'])
def update_user_data(user_id):
    return lambda_to_flask(update_user_data_handler)(user_id=user_id)

@app.route('/api/users/<user_id>/data', methods=['GET'])
def get_user_data(user_id):
    return lambda_to_flask(get_user_data_handler)(user_id=user_id)

# Family routes - create, update, and get
@app.route('/api/family_info', methods=['POST'])
def create_family():
    return lambda_to_flask(update_family_handler)()

@app.route('/api/family_info/<family_id>', methods=['GET', 'POST'])
def family_info(family_id):
    return lambda_to_flask(update_family_handler)(family_id=family_id)

# Fund routes - create, update, delete, and get
@app.route('/api/retirement_fund', methods=['POST'])
def create_fund():
    return lambda_to_flask(update_fund_handler)()

@app.route('/api/retirement_fund/<fund_id>', methods=['GET', 'POST', 'DELETE'])
def retirement_fund(fund_id):
    return lambda_to_flask(update_fund_handler)(fund_id=fund_id)

# Budget routes - create, update, and get
@app.route('/api/budget', methods=['POST'])
def create_budget():
    return lambda_to_flask(update_budget_handler)()

@app.route('/api/budget/<budget_id>', methods=['GET', 'POST', 'DELETE'])
def budget(budget_id):
    return lambda_to_flask(update_budget_handler)(budget_id=budget_id)

if __name__ == '__main__':
    print(f"Starting Flask dev server with Python {sys.version}")
    print(f"Python executable: {sys.executable}")
    app.run(host='0.0.0.0', port=5000, debug=True)