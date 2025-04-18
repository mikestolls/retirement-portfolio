from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@api_bp.route('/data', methods=['GET'])
def get_data():
    return jsonify({
        "message": "Hello from Flask Backend!",
        "status": "success"
    })
