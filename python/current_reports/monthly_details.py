import psycopg2
from flask import Flask, jsonify, request
from dateutil.relativedelta import relativedelta
from datetime import datetime

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

def fetch_monthly_report(client, start_date, end_date):
    query = """
    SELECT 
        TO_CHAR(th.work_date, 'YYYY-MM') AS month_year,
        SUM(th.hours) AS total_hours,
        SUM(th.hours * ep.employee_wage) AS total_cost,
        cb.client_payment_amount,
        cb.client_billing_schedule
    FROM timesheet_hours2 th
    LEFT JOIN employee_pay ep ON ep.employee_id = th.employee_id
    LEFT JOIN client_billing cb ON cb.client_id = (SELECT id FROM clients WHERE company_name = %s)
    WHERE th.company_name = %s AND th.work_date BETWEEN %s AND %s
    GROUP BY month_year, cb.client_payment_amount, cb.client_billing_schedule
    ORDER BY month_year;
    """
    
    data = {}

    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (client, client, start_date, end_date))  # Safe parameterized query
                rows = cursor.fetchall()
                
                start_dt = start_date if isinstance(start_date, datetime) else datetime.strptime(start_date, "%Y-%m-%d")
                end_dt = end_date if isinstance(end_date, datetime) else datetime.strptime(end_date, "%Y-%m-%d")
                months_selected = (end_dt.year - start_dt.year) * 12 + (end_dt.month - start_dt.month) + 1

                for month_year, total_hours, total_cost, client_payment, billing_schedule in rows:
                    # Determine total payment based on billing schedule
                    billing_cycles = 0
                    if billing_schedule == 'A':  # Paid once per 12 months
                        billing_cycles = months_selected // 12
                    elif billing_schedule == 'BA':  # Paid every 6 months
                        billing_cycles = months_selected // 6
                    elif billing_schedule == 'Q':  # Paid every 3 months
                        billing_cycles = months_selected // 3
                    elif billing_schedule == 'M':  # Paid every month
                        billing_cycles = months_selected
                    billing_cycles = max(1, billing_cycles)

                    total_payment = client_payment * billing_cycles
                    
                    # Calculate profit/loss percentage
                    profit_loss_percentage = ((total_payment - total_cost) / total_cost) * 100 if total_cost != 0 else 0
                    
                    data[month_year] = {
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
