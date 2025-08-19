# Retirement calculator service - contains business logic for retirement calculations
from decimal import Decimal
from datetime import datetime
        
def get_return_rate_for_age(age, return_rate_params):
    for param in return_rate_params:
        if param['fromAge'] <= age <= param['toAge']:
            return float(param['returnRate']) * 0.01
        
    return 0.07  # Default 7% if no matching range

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
    
        # Get return rate parameters from fund data
        return_rate_params = fund.get('return-rate-params', [])
        
        retirement_data = []
        current_amount = initial_investment
        year = datetime.now().year

        # Calculate retirement projection for each year
        for current_age in range(age, life_expectancy + 1):
            begin_amount = current_amount
            annual_return_rate = get_return_rate_for_age(current_age, return_rate_params)

            if current_age >= retirement_age:   
                # in retirement phase           
                withdrawal = begin_amount * retirement_withdrawal
                contribution = 0
            else:
                # in accumulation phase
                withdrawal = 0
                contribution = regular_contribution * contribution_frequency

            # Calculate growth (compounded)
            inc_return_rate = annual_return_rate / contribution_frequency
            inc_withdrawal = withdrawal / contribution_frequency
            inc_contribution = contribution / contribution_frequency
            for i in range(contribution_frequency):
                current_amount = (current_amount + inc_contribution - inc_withdrawal) * (1 + inc_return_rate)

            # Calculate growth
            growth = current_amount - begin_amount - contribution + withdrawal
            
            retirement_data.append({
                "year": year,
                "age": current_age,
                "annual_return_rate": annual_return_rate,
                "begin_amount": float(round(begin_amount, 2)),
                "contribution": float(round(contribution, 2)),
                "withdrawal": float(round(withdrawal, 2)),
                "growth": float(round(growth, 2)),
                "end_amount": float(round(current_amount, 2))
            })
            
            withdrawal *= (1 + retirement_inflation) # Adjust for inflation
            year = year + 1
        
        fund['retirement_projection'] = retirement_data
        