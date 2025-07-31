from flask import Blueprint, jsonify, request
from backend.models.retirement_fund_data import RetirementFundData
from backend.models.family_info_data import FamilyInfoData
from services.retirement_calculator import calculate_retirement_projection
from db.dynamodb import db_get_family_info, db_save_family_info

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@api_bp.route('/get_family_info/<string:user_id>', methods=['GET'])
def get_family_info(user_id):
    try:        
        # Validate required parameters
        if not user_id or user_id.strip() == "":
            return jsonify({
                "message": "user_id not provided",
                "status": "error"
            }), 400
            
        # Get specific portfolio
        family_info = db_get_family_info(user_id)
        if not family_info:
            return jsonify({"message": "Family info not found", "status": "error"}), 404
        
        test = jsonify(family_info)
        
        # Return family info
        return jsonify(family_info), 200
    except Exception as e:
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "status": "error"
        }), 500

@api_bp.route('/update_family_info/<string:user_id>', methods=['POST'])
def update_family_info(user_id):
    try:
        # Validate required parameters
        if not user_id or user_id.strip() == "":
            return jsonify({
                "message": "user_id not provided",
                "status": "error"
            }), 400
        
        # Validate required parameters
        if not user_id or user_id.strip() == "":
            return jsonify({
                "message": "user_id parameter is required",
                "status": "error"
            }), 400
        
         # Get JSON data from request
        input_data = request.get_json()
        if not input_data:
            return jsonify({
                "message": "No data provided!",
                "status": "error"
            }), 400
        
        # Create and validate input model
        family_info_data = FamilyInfoData(input_data)
        is_valid, error_message = family_info_data.validate()
        
        if not is_valid:
            return jsonify({
                "message": error_message,
                "status": "error"
            }), 400
        
        # Get validated input data
        validated_input = family_info_data.to_dict()
        
        saved_id = db_save_family_info(user_id, validated_input)
        
        return jsonify(saved_id), 200
        
    except Exception as e:
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "status": "error"
        }), 500

@api_bp.route('/get_retirement_data/<string:user_id>', methods=['GET'])
def get_retirement_data(user_id):
    try:
        # Validate required parameters
        if not user_id or user_id.strip() == "":
            return jsonify({
                "message": "user_id not provided",
                "status": "error"
            }), 400
            
        portfolio_id = request.args.get('portfolio_id')
        if not portfolio_id:
            return jsonify({
                "message": "portfolio_id parameter is required",
                "status": "error"
            }), 400
        
        # Get specific portfolio
        portfolio = get_portfolio(portfolio_id)
        if not portfolio:
            return jsonify({"message": "Portfolio not found", "status": "error"}), 404
                
        # Calculate retirement projection
        retirement_data = calculate_retirement_projection(portfolio['input_data'])

        return jsonify(retirement_data), 200
    except Exception as e:
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "status": "error"
        }), 500

@api_bp.route('/update_retirement_input/<string:user_id>', methods=['POST'])
def update_retirement_input(user_id):
    try:
        # Validate required parameters
        if not user_id or user_id.strip() == "":
            return jsonify({
                "message": "user_id not provided",
                "status": "error"
            }), 400
        
        # Get JSON data from request
        input_data = request.get_json()
        if not input_data:
            return jsonify({
                "message": "No data provided!",
                "status": "error"
            }), 400
        
        portfolio_id = 'portfolio_id' # request.args.get('portfolio_id')
        
        # Create and validate input model
        retirement_input = RetirementFundData(input_data)
        is_valid, error_message = retirement_input.validate()
        
        if not is_valid:
            return jsonify({
                "message": error_message,
                "status": "error"
            }), 400
        
        # Get validated input data
        validated_input = retirement_input.to_dict()
        
        # Save to DynamoDB
        portfolio_data = {
            'portfolio_id': portfolio_id,
            'input_data': validated_input
        }
        
        saved_id = save_portfolio(user_id, portfolio_data)
        
        # Get the saved portfolio
        saved_portfolio = get_portfolio(saved_id)
        
        return jsonify(saved_portfolio), 200
        
    except Exception as e:
        return jsonify({
            "message": f"An error occurred: {str(e)}",
            "status": "error"
        }), 500