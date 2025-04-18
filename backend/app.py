from flask import Flask
from flask_cors import CORS
from api.routes import api_bp
from config.config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
