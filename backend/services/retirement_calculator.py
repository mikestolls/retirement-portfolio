# Retirement calculator service - contains business logic for retirement calculations
from decimal import Decimal
from datetime import datetime

def calculate_retirement_projection(retirement_fund_info, family_info):
    """
    Calculate retirement projection based on retirement fund info and family info.
    
    Args:
        retirement_fund_info (dict): Dictionary containing retirement fund data
        family_info (dict): Dictionary containing family information data

    Returns:
        dict: Retirement projection data by year
    """
    for fund in retirement_fund_info.get('retirement_fund_data', []):   
        # get family member data from family_info
        family_member_id = fund['family-member-id']
        family_member = next((member for member in family_info.get('family_info_data', []) if member['id'] == family_member_id), None)

        if not family_member:
            raise ValueError(f"Family member with ID {family_member_id} not found in family info")

        age = int(family_member['age'])
        life_expectancy = int(family_member['life-expectancy'])
        retirement_age = int(family_member['retirement-age'])
        retirement_withdrawal = float(family_member['retirement-withdrawal']) * 0.01
        retirement_inflation = float(family_member['retirement-inflation']) * 0.01
    
        # Convert numeric inputs to Decimal for precise financial calculations
        initial_investment = int(fund['initial-investment'])
        regular_contribution = int(fund['regular-contribution'])
        contribution_frequency = int(fund['contribution-frequency'])
        annual_contribution = regular_contribution * contribution_frequency
    
        # Investment return assumptions
        annual_return_rate = 0.07 # 7% average annual return
        
        retirement_data = []
        current_amount = initial_investment
        year = datetime.now().year

        # Pre-retirement phase: accumulation
        for current_age in range(age, retirement_age + 1):
            begin_amount = current_amount
            contribution = annual_contribution
            
            # Calculate growth (simplified)
            growth = (begin_amount + contribution / 2) * annual_return_rate
            
            # Calculate end amount
            end_amount = begin_amount + contribution + growth
            
            retirement_data.append({
                "year": year,
                "age": current_age,
                "begin_amount": float(round(begin_amount, 2)),
                "contribution": float(round(contribution, 2)),
                "growth": float(round(growth, 2)),
                "end_amount": float(round(end_amount, 2)),
                "withdrawal": 0
            })
            
            current_amount = end_amount
            year = year + 1
        
        # Post-retirement phase: distribution
        for current_age in range(retirement_age + 1, life_expectancy + 1):
            begin_amount = current_amount
            contribution = 0
            
            # Calculate withdrawal
            withdrawal = begin_amount * retirement_withdrawal
            retirement_withdrawal = retirement_withdrawal * (1 + retirement_inflation) # Adjust for inflation
            
            # Calculate growth (after withdrawal)
            growth = (begin_amount - withdrawal / 2) * annual_return_rate
            
            # Calculate end amount
            end_amount = begin_amount - withdrawal + growth
            
            retirement_data.append({
                "year": year,
                "age": current_age,
                "begin_amount": float(round(begin_amount, 2)),
                "contribution": 0,
                "growth": float(round(growth, 2)),
                "end_amount": float(round(end_amount, 2)),
                "withdrawal": float(round(withdrawal, 2))
            })
            
            current_amount = end_amount
            year = year + 1
        
        fund['retirement_projection'] = retirement_data
        