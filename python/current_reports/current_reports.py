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


def get_client_hours():
    """
    Fetches total hours worked for each client.
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

    return data  # Return dictionary instead of jsonify

