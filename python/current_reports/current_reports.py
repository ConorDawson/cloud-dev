import psycopg2
from flask import Flask, jsonify, request
from dateutil.relativedelta import relativedelta
from datetime import datetime
import os

# Database connection information
DB_CONFIG = {
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "express-finance-db.c500oesmmplc.eu-north-1.rds.amazonaws.com"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_DATABASE", "postgres"),
    "sslmode": "require"  # Ensures SSL is used if required
}

app = Flask(__name__)

def get_db_connection():
    """
    Establish a connection to the PostgreSQL database
    """
    try:
        conn = psycopg2.connect(
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            sslmode=DB_CONFIG["sslmode"]
        )
        return conn
    except psycopg2.Error as e:
        print("Database connection error:", e)
        return None

def xor_decrypt(text, key=5):
    """
    XOR decryption for the encrypted text.
    """
    return ''.join([chr(ord(char) ^ key) for char in text])

def fetch_client_data(start_date, end_date):
    """
    Fetches the data from the database.
    """
    query = """
    SELECT 
        c.company_name,
        th.hours,
        ep.employee_wage,
        cb.client_payment_amount,
        th.work_date,
        cb.client_billing_schedule
    FROM clients c
    LEFT JOIN timesheet_hours2 th ON th.company_name = c.company_name
    LEFT JOIN employee_pay ep ON ep.employee_id = th.employee_id
    LEFT JOIN client_billing cb ON cb.client_id = c.id
    WHERE th.work_date BETWEEN %s AND %s
    ORDER BY c.company_name, th.work_date;
    """
    
    with psycopg2.connect(**DB_CONFIG) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, (start_date, end_date))  # Safe parameterized query
            rows = cursor.fetchall()

    # Decrypt company names
    decrypted_rows = []
    for row in rows:
        decrypted_row = list(row)
        decrypted_row[0] = xor_decrypt(decrypted_row[0])  # Decrypt company_name
        decrypted_rows.append(tuple(decrypted_row))

    return decrypted_rows

def process_client_data(rows):
    """
    Processes the fetched data to calculate total hours and total cost for each client.
    """
    client_data = {}
    for row in rows:
        company_name, hours, employee_wage, client_payment, work_date, billing_schedule = row
        
        # Check for None values and assign default values if necessary
        hours = hours if hours is not None else 0
        employee_wage = employee_wage if employee_wage is not None else 0
        client_payment = client_payment if client_payment is not None else 0
        
        if company_name not in client_data:
            client_data[company_name] = {
                'total_hours': 0,
                'total_cost': 0,
                'client_payment': client_payment,
                'billing_schedule': billing_schedule
            }

        # Accumulate the hours and cost for each client
        client_data[company_name]['total_hours'] += hours
        client_data[company_name]['total_cost'] += hours * employee_wage
    
    return client_data

def calculate_profit_loss(client_data, start_date, end_date):
    """
    Calculates the profit/loss percentage for each client while considering the billing schedule 
    and the number of months in the selected period.
    """
    start_date = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = datetime.strptime(end_date, "%Y-%m-%d")

    months_selected = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month) + 1

    for company_name, info in client_data.items():
        total_cost = info['total_cost']
        client_payment = info['client_payment'] if info['client_payment'] is not None else 0
        billing_schedule = info['billing_schedule']
        total_payment = 0

        # Determine number of billing cycles in the selected period
        if billing_schedule == 'A':  # Paid once per 12 months
            billing_cycles = months_selected // 12
        elif billing_schedule == 'BA':  # Paid every 6 months
            billing_cycles = months_selected // 6
        elif billing_schedule == 'Q':  # Paid every 3 months
            billing_cycles = months_selected // 3
        elif billing_schedule == 'M':  # Paid every month
            billing_cycles = months_selected
        else:
            billing_cycles = 0  # Default if an unknown schedule appears

        billing_cycles = max(1, billing_cycles)
        total_payment = client_payment * billing_cycles

        if total_cost == 0:
            profit_loss_percentage = 0
        else:
            profit_loss_percentage = ((total_payment - total_cost) / total_cost) * 100

        info['profit_loss_percentage'] = profit_loss_percentage
        info['client_payment'] = total_payment

    return client_data

def prepare_final_data(client_data):
    """
    Prepares the final data structure for the response.
    """
    data = []
    for company_name, info in client_data.items():
        data.append({
            'Client': company_name,
            'Total Hours Worked': info['total_hours'],
            'Cost': info['total_cost'],
            'Client Payment': info['client_payment'],
            'Profit/Loss %': info['profit_loss_percentage'],
            'Billing Schedule': info['billing_schedule']
        })
    return data

if __name__ == '__main__':
    app.run(port=5001)
