from flask import Blueprint, jsonify, request
from backend.models.retirement_input import RetirementInput
from backend.services.retirement_calculator import calculate_retirement_projection

api_bp = Blueprint('api', __name__)
retirement_input_data = {}
retirement_data = {}

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@api_bp.route('/get_retirement_data', methods=['GET'])
def get_retirement_data():
    global retirement_data
    return jsonify(retirement_data), 200

@api_bp.route('/update_retirement_input', methods=['POST'])
def update_retirement_input():
    global retirement_input_data
    global retirement_data

    try:
        # Get JSON data from request
        input_data = request.get_json()
        if not input_data:
            return jsonify({
                "message": "No data provided!",
                "status": "error"
            }), 400
        
        # Create and validate input model
        retirement_input = RetirementInput(input_data)
        is_valid, error_message = retirement_input.validate()
        
        if not is_valid:
            return jsonify({
                "message": error_message,
                "status": "error"
            }), 400
        
        # Store validated input data
        retirement_input_data = retirement_input.to_dict()
        
        # Calculate retirement projection
        retirement_data = calculate_retirement_projection(retirement_input_data)
        
        return jsonify(retirement_data), 200
        
    except Exception as e:
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "status": "error"
        }), 500