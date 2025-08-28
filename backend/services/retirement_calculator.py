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
    # Find the latest retirement year across all family members
    latest_retirement_year = 0
    for member in family_info.get('family_info_data', []):
        member_dob = datetime.strptime(member['date-of-birth'], '%Y-%m-%d')
        member_age = (datetime.now() - member_dob).days // 365
        member_retirement_year = datetime.now().year + (int(member['retirement-age']) - member_age)
        latest_retirement_year = max(latest_retirement_year, member_retirement_year)
    
    for fund in retirement_fund_info.get('retirement_fund_data', []):   
        # get family member data from family_info
        family_member_id = fund['family-member-id']
        family_member = next((member for member in family_info.get('family_info_data', []) if member['id'] == family_member_id), None)

        if not family_member:
            fund['retirement_projection'] = []
            continue

        # Calculate age from date of birth
        dob = datetime.strptime(family_member['date-of-birth'], '%Y-%m-%d')
        age = (datetime.now() - dob).days // 365
        retirement_age = int(family_member['retirement-age'])
        
        # Calculate end age - continue until latest family member retires + 5 years
        end_year = latest_retirement_year + 5
        end_age = age + (end_year - datetime.now().year)
    
        # Convert numeric inputs to Decimal for precise financial calculations
        initial_investment = int(fund['initial-investment'])
        regular_contribution = int(fund['regular-contribution'])
        contribution_frequency = int(fund['contribution-frequency'])
    
        # Get return rate parameters from fund data
        return_rate_params = fund.get('return-rate-params', [])
        
        retirement_data = []
        current_amount = initial_investment
        retirement_amount = 0  # Amount at retirement to maintain
        year = datetime.now().year

        # Calculate retirement projection for each year
        for current_age in range(age, end_age + 1):
            begin_amount = current_amount
            annual_return_rate = get_return_rate_for_age(current_age, return_rate_params)
            
            if current_age < retirement_age:
                # Accumulation phase - continue contributions and growth
                contribution = regular_contribution * contribution_frequency
                
                # Calculate growth (compounded)
                inc_return_rate = annual_return_rate / contribution_frequency
                inc_contribution = contribution / contribution_frequency
                for i in range(contribution_frequency):
                    current_amount = (current_amount + inc_contribution) * (1 + inc_return_rate)
                
                growth = current_amount - begin_amount - contribution
            else:
                # Retirement phase - maintain amount at retirement level
                if current_age == retirement_age:
                    retirement_amount = current_amount
                
                contribution = 0
                growth = 0
                current_amount = retirement_amount  # Flatline at retirement amount
            
            retirement_data.append({
                "year": year,
                "age": current_age,
                "annual_return_rate": annual_return_rate,
                "begin_amount": float(round(begin_amount, 2)),
                "contribution": float(round(contribution, 2)),
                "growth": float(round(growth, 2)),
                "end_amount": float(round(current_amount, 2))
            })
            
            year = year + 1
        
        fund['retirement_projection'] = retirement_data
        