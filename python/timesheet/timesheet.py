import psycopg2
from flask import Flask, jsonify, request
from psycopg2.extras import execute_values
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

def submit_timesheet():
    timesheet_data = request.json

    if not isinstance(timesheet_data, list) or len(timesheet_data) == 0:
        return jsonify({"error": "Invalid timesheet data"}), 400

    query = """
        INSERT INTO timesheet_hours2 (company_name, hours, work_date, employee_id) 
        VALUES %s
        ON CONFLICT (company_name, work_date, employee_id)
        DO UPDATE SET hours = EXCLUDED.hours
        RETURNING company_name, hours, work_date, employee_id;
    """

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()

        values = [(entry['clientName'], float(entry['hours']), entry['date'], int(entry['employee_id']))
                  for entry in timesheet_data]

        execute_values(cur, query, values)
        conn.commit()

        result = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify({"message": "Timesheet submitted successfully", "data": result}), 200

    except Exception as e:
        print("Database error:", str(e))
        return jsonify({"error": "Database error", "details": str(e)}), 500
    

    
if __name__ == '__main__':
    app.run(port=5001)