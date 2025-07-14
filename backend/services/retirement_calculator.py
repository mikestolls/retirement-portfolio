# Retirement calculator service - contains business logic for retirement calculations

def calculate_retirement_projection(input_data):
    """
    Calculate retirement projection based on input parameters
    
    Args:
        input_data (dict): Dictionary containing retirement input parameters
        
    Returns:
        dict: Retirement projection data by year
    """
    age = input_data['age']
    retirement_age = input_data['retirement_age']
    death_age = 90  # Assumption
    
    initial_investment = input_data['initial_investment']
    regular_contribution = input_data['regular_contribution']
    contribution_frequency = input_data['contribution_frequency']
    annual_contribution = regular_contribution * contribution_frequency
    
    # Investment return assumptions
    annual_return_rate = 0.07  # 7% average annual return
    inflation_rate = input_data['retirement_inflation'] / 100
    withdrawal_rate = input_data['retirement_withdrawal'] / 100
    
    retirement_data = []
    current_amount = initial_investment
    
    # Pre-retirement phase: accumulation
    for current_age in range(age, retirement_age + 1):
        begin_amount = current_amount
        contribution = annual_contribution
        
        # Calculate growth (simplified)
        growth = (begin_amount + contribution / 2) * annual_return_rate
        
        # Calculate end amount
        end_amount = begin_amount + contribution + growth
        
        retirement_data.append({
            "age": current_age,
            "begin_amount": round(begin_amount, 2),
            "contribution": round(contribution, 2),
            "growth": round(growth, 2),
            "end_amount": round(end_amount, 2),
            "withdrawal": 0
        })
        
        current_amount = end_amount
    
    # Post-retirement phase: distribution
    for current_age in range(retirement_age + 1, death_age + 1):
        begin_amount = current_amount
        contribution = 0
        
        # Calculate withdrawal
        withdrawal = begin_amount * withdrawal_rate
        
        # Calculate growth (after withdrawal)
        growth = (begin_amount - withdrawal / 2) * annual_return_rate
        
        # Calculate end amount
        end_amount = begin_amount - withdrawal + growth
        
        retirement_data.append({
            "age": current_age,
            "begin_amount": round(begin_amount, 2),
            "contribution": 0,
            "growth": round(growth, 2),
            "end_amount": round(end_amount, 2),
            "withdrawal": round(withdrawal, 2)
        })
        
        current_amount = end_amount
    
    return {"retirement_data": retirement_data}