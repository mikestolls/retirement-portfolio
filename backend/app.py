import os
import time
from flask import Flask
from flask_cors import CORS
from api.routes import api_bp
from config.config import Config
from db.dynamodb import create_tables_if_not_exist

# Set AWS credentials for local development if not already set
if not os.environ.get('AWS_ACCESS_KEY_ID'):
    os.environ['AWS_ACCESS_KEY_ID'] = 'dummy'
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'dummy'
    os.environ['AWS_SESSION_TOKEN'] = 'dummy'
    os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

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
        create_tables_if_not_exist()
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
