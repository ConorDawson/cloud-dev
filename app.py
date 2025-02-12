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

@app.route('/api/client_hours', methods=['GET'])
def get_client_hours():
    """
    Fetches total hours worked for each client and returns them as a JSON response.
    """
    query = """
    SELECT company_name, SUM(hours) AS total_hours
    FROM timesheet_hours2
    GROUP BY company_name
    ORDER BY company_name;
    """
    data = {}

    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query)
                rows = cursor.fetchall()
                for company, hours in rows:
                    data[company] = float(hours)
    except Exception as e:
        print(f"Error fetching data: {e}")

    return jsonify(data)


@app.route('/api/monthly_report', methods=['GET'])
def get_monthly_report():
    """
    Fetches the monthly breakdown of hours worked for a specific client and year.
    The client and year are provided as query parameters.
    """
    client = request.args.get('client')
    year = request.args.get('year')

    if not client or not year:
        return jsonify({"error": "Client and Year parameters are required"}), 400

    query = """
    SELECT EXTRACT(MONTH FROM work_date) AS month, SUM(hours) AS total_hours
    FROM timesheet_hours2
    WHERE company_name = %s AND EXTRACT(YEAR FROM work_date) = %s
    GROUP BY month
    ORDER BY month;
    """
    
    data = {}

    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, (client, year))
                rows = cursor.fetchall()
                for month, hours in rows:
                    data[int(month)] = float(hours)
                
        
    except Exception as e:
        print(f"Error fetching data: {e}")

    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5001)
