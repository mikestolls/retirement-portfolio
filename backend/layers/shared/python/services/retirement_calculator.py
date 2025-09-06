# Retirement calculator service - contains business logic for retirement calculations
from decimal import Decimal
from datetime import datetime
        
def get_return_rate_for_age(age, return_rate_params):
    for param in return_rate_params:
        if param['from_age'] <= age <= param['to_age']:
            return float(param['return_rate']) * 0.01
        
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
        member_dob = datetime.strptime(member['date_of_birth'], '%Y-%m-%d')
        member_age = (datetime.now() - member_dob).days // 365
        member_retirement_year = datetime.now().year + (int(member['retirement_age']) - member_age)
        latest_retirement_year = max(latest_retirement_year, member_retirement_year)
    
    for fund in retirement_fund_info.get('retirement_fund_data', []):   
        # get family member data from family_info
        family_member_id = fund['family_member_id']
        family_member = next((member for member in family_info.get('family_info_data', []) if member['id'] == family_member_id), None)

        if not family_member:
            fund['retirement_projection'] = []
            continue

        # Calculate age from date of birth
        dob = datetime.strptime(family_member['date_of_birth'], '%Y-%m-%d')
        age = (datetime.now() - dob).days // 365
        retirement_age = int(family_member['retirement_age'])
        
        # Calculate end age - continue until latest family member retires + 5 years
        end_year = latest_retirement_year + 5
        end_age = age + (end_year - datetime.now().year)
    
        # Convert numeric inputs to Decimal for precise financial calculations
        initial_investment = int(fund['initial_investment'])
        regular_contribution = int(fund['regular_contribution'])
        contribution_frequency = int(fund['contribution_frequency'])
    
        # Get return rate parameters from fund data
        return_rate_params = fund.get('return_rate_params', [])
        
        # Get fund start date or default to current year
        start_date = fund.get('start_date')
        if start_date:
            start_year = datetime.strptime(start_date, '%Y-%m-%d').year
            start_age = age + (start_year - datetime.now().year)
        else:
            start_year = datetime.now().year
            start_age = age
        
        retirement_data = []
        current_amount = initial_investment
        retirement_amount = 0  # Amount at retirement to maintain
        year = start_year

        # Calculate retirement projection for each year
        for current_age in range(start_age, end_age + 1):
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
            
            # Check for actual data
            actual_data_list = fund.get('actual_data', [])
            year_actual_data = next((data for data in actual_data_list if data.get('year') == year), None)
            is_actual_balance = False

            if year_actual_data:
                current_amount = float(year_actual_data.get('actual_balance'))
                contribution = float(year_actual_data.get('actual_contributions'))
                growth = float(year_actual_data.get('actual_growth'))
                is_actual_balance = True
                        
            retirement_data.append({
                "year": year,
                "age": current_age,
                "annual_return_rate": annual_return_rate,
                "begin_amount": float(round(begin_amount, 2)),
                "contribution": float(round(contribution, 2)),
                "growth": float(round(growth, 2)),
                "end_amount": float(round(current_amount, 2)),
                "is_actual_balance": is_actual_balance,
            })
            
            year = year + 1
        
        fund['retirement_projection'] = retirement_data
        