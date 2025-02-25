import psycopg2
from flask import Flask, jsonify, request

# Database connection information
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "postgres"
}

app = Flask(__name__)

def get_db_connection():
    """
    Establish a connection to the PostgreSQL database
    """
    conn = psycopg2.connect(
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        database=DB_CONFIG["database"]
    )
    return conn

def fetch_monthly_report():
    """
    Fetches the monthly breakdown of hours worked, cost, client payment, and profit/loss for a specific client and year.
    The client and year are provided as query parameters.
    """
    client = request.args.get('client')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not client or not start_date or not end_date:
        return jsonify({"error": "Client, Start Date, and End Date parameters are required"}), 400

    query = """
SELECT 
    th.employee_id,
    TO_CHAR(th.work_date, 'YYYY-MM') AS month_year,
    SUM(th.hours) AS total_hours,
    SUM(th.hours * ep.employee_wage) AS total_cost,
    cb.client_payment_amount,
    cb.client_billing_schedule
FROM timesheet_hours2 th
LEFT JOIN employee_pay ep ON ep.employee_id = th.employee_id
LEFT JOIN client_billing cb ON cb.client_id = (SELECT id FROM clients WHERE company_name = 'Creative Minds')
WHERE th.company_name = %s AND th.work_date BETWEEN %s AND %s
GROUP BY th.employee_id, month_year, cb.client_payment_amount, cb.client_billing_schedule
ORDER BY th.employee_id, month_year;
"""
    
    data = {}

    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (client, client, start_date, end_date))  # Safe parameterized query
                rows = cursor.fetchall()
                
                for month, total_hours, total_cost, client_payment, billing_schedule in rows:
                    # Determine total payment based on billing schedule
                    total_payment = 0
                    if billing_schedule == 'A':
                        total_payment = client_payment / 12
                    elif billing_schedule == 'BA':
                        total_payment = client_payment / 6
                    elif billing_schedule == 'Q':
                        total_payment = client_payment / 3
                    elif billing_schedule == 'M':
                        total_payment = client_payment
                    
                    # Calculate profit/loss percentage
                    profit_loss_percentage = ((total_payment - total_cost) / total_cost) * 100 if total_cost != 0 else 0
                    
                    data[int(month)] = {
                        "Total Hours Worked": float(total_hours),
                        "Total Cost": float(total_cost),
                        "Client Payment": float(total_payment),
                        "Profit/Loss %": float(profit_loss_percentage)
                    }
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({"error": "Internal server error"}), 500

    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5001)
