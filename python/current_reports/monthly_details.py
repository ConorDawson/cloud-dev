import psycopg2
from flask import Flask, jsonify, request
from dateutil.relativedelta import relativedelta
from datetime import datetime

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
                    # Determine the number of payments per year
                    payments_per_year = 12  # Default to annual billing
                    if billing_schedule == 'A':  # Paid every 6 months
                        payments_per_year = 12
                    elif billing_schedule == 'BA':  # Paid every 6 months
                        payments_per_year = 6
                    elif billing_schedule == 'Q':  # Paid every 3 months
                        payments_per_year = 3
                    elif billing_schedule == 'M':  # Paid every month
                        payments_per_year = 1

                    # Adjust client payment amount to a monthly value
                    monthly_payment = client_payment / payments_per_year

                    # Calculate profit/loss percentage
                    profit_loss_percentage = ((monthly_payment - total_cost) / total_cost) * 100 if total_cost != 0 else 0
                    
                    data[month_year] = {
                        "Total Hours Worked": float(total_hours),
                        "Total Cost": float(total_cost),
                        "Client Payment": float(monthly_payment),
                        "Profit/Loss %": float(profit_loss_percentage)
                    }
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({"error": "Internal server error"}), 500

    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5001)
