from flask import Blueprint, jsonify, request
from models.retirement_input import RetirementInput
from services.retirement_calculator import calculate_retirement_projection
from db.dynamodb import save_portfolio, get_portfolio, get_user_portfolios

api_bp = Blueprint('api', __name__)

# Default user ID for demo purposes
DEFAULT_USER_ID = 'demo-user'

@api_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@api_bp.route('/get_retirement_data', methods=['GET'])
def get_retirement_data():
    try:
        # Get portfolio ID from query params or use latest
        user_id = 'user' # request.args.get('user_id', DEFAULT_USER_ID)
        portfolio_id = 'portfolio_id' #request.args.get('portfolio_id')
        
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

@api_bp.route('/update_retirement_input', methods=['POST'])
def update_retirement_input():
    try:
        # Get JSON data from request
        input_data = request.get_json()
        if not input_data:
            return jsonify({
                "message": "No data provided!",
                "status": "error"
            }), 400
        
        # Get user ID from request or use default
        user_id = 'user' # request.args.get('user_id', DEFAULT_USER_ID)
        portfolio_id = 'portfolio_id' # request.args.get('portfolio_id')
        
        # Create and validate input model
        retirement_input = RetirementInput(input_data)
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