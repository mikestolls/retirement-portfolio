#!/usr/bin/env python3
"""Fast development server that wraps Lambda functions"""

import sys
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add layers to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'layers', 'shared', 'python'))

# Set environment variables
os.environ['DYNAMODB_ENDPOINT_URL'] = 'http://localhost:8000'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

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
update_family_handler = load_handler('update-family-info')
get_user_data_handler = load_handler('get-user-data')
update_fund_handler = load_handler('update-retirement-fund')
update_budget_handler = load_handler('update-budget')

app = Flask(__name__)
CORS(app)

def lambda_to_flask(handler):
    """Convert Lambda handler to Flask route"""
    def wrapper(*args, **kwargs):
        # Build Lambda event from Flask request
        event = {
            'pathParameters': kwargs,
            'queryStringParameters': dict(request.args) if request.args else None,
            'body': request.get_data(as_text=True) if request.data else None,
            'httpMethod': request.method,
            'headers': dict(request.headers)
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

@app.route('/api/user_data/<user_id>', methods=['GET'])
def get_user_data(user_id):
    return lambda_to_flask(get_user_data_handler)(user_id=user_id)

@app.route('/api/family_info/<family_id>', methods=['POST'])
def update_family(family_id):
    return lambda_to_flask(update_family_handler)(family_id=family_id)

@app.route('/api/retirement_fund/<fund_id>', methods=['POST', 'DELETE'])
def update_fund(fund_id):
    return lambda_to_flask(update_fund_handler)(fund_id=fund_id)

@app.route('/api/budget/<budget_id>', methods=['POST'])
def update_budget(budget_id):
    return lambda_to_flask(update_budget_handler)(budget_id=budget_id)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)