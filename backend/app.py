import os
import time
from flask import Flask
from flask_cors import CORS
from api.routes import api_bp
from config.config import Config
from db.dynamodb import db_create_tables_if_not_exist
from dotenv import load_dotenv

load_dotenv()  # Load .env file

# Debug: Print all environment variables
print("=== ENVIRONMENT VARIABLES ===")
print(f"DYNAMODB_ENDPOINT_URL: {os.environ.get('DYNAMODB_ENDPOINT_URL')}")
print(f"AWS_ACCESS_KEY_ID: {os.environ.get('AWS_ACCESS_KEY_ID')}")
print(f"AWS_SECRET_ACCESS_KEY: {os.environ.get('AWS_SECRET_ACCESS_KEY')}")
print(f"AWS_DEFAULT_REGION: {os.environ.get('AWS_DEFAULT_REGION')}")
print("=============================")

# Now you can use os.environ
endpoint_url = os.environ.get('DYNAMODB_ENDPOINT_URL')

# Set DynamoDB endpoint for local development
if not os.environ.get('DYNAMODB_ENDPOINT') and os.environ.get('FLASK_ENV') == 'development':
    os.environ['DYNAMODB_ENDPOINT'] = 'http://localhost:8000'

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    # Initialize DynamoDB tables
    with app.app_context():
        db_create_tables_if_not_exist()
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
