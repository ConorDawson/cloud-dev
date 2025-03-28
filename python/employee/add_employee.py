import psycopg2
from flask import Flask, jsonify, request
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


def add_new_employee():
    data = request.get_json()
    
    employee_forename = data['employee_forename']
    employee_surname = data['employee_surname']
    employee_email = data['employee_email']
    employee_password = data['employee_password']
    employee_wage = data['employee_wage']
    role = data['role']

    print(f"Adding employee: {employee_forename} {employee_surname}, Email: {employee_email}, Password: {employee_password}, Role: {role}, Wage: {employee_wage}")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if the email already exists
        cursor.execute("SELECT email FROM users WHERE email = %s", (employee_email,))
        existing_email = cursor.fetchone()

        if existing_email:
            # If email already exists, return an error message and stop execution
            print("Email already exists")
            return jsonify({"message": "Email already exists"}), 400  # Prevent the employee from being added

        # Get the next available employee_id
        cursor.execute("SELECT MAX(employee_id) FROM users")
        max_employee_id = cursor.fetchone()[0]
        next_employee_id = max_employee_id + 1 if max_employee_id else 1

        # Insert the new employee into the users table
        cursor.execute(""" 
            INSERT INTO users (employee_id, email, password, employee_forename, employee_surname, role)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (next_employee_id, employee_email, employee_password, employee_forename, employee_surname, role))

        # Insert the employee wage into the employee_pay table
        cursor.execute(""" 
            INSERT INTO employee_pay (employee_id, employee_wage)
            VALUES (%s, %s)
        """, (next_employee_id, employee_wage))

        # Commit the changes and close the connection
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Employee added successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error adding employee"}), 500



if __name__ == '__main__':
    app.run(port=5001)
