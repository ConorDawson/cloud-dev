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

# Encryption key for XOR cipher
ENCRYPTION_KEY = 5

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

def xor_encrypt(text):
    """
    Encrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in text)

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

def xor_decrypt(cipher_text):
    """
    Decrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in cipher_text)

@app.route('/add_employee', methods=['POST'])
def add_new_employee():
    data = request.get_json()

    # Encrypt the input data
    encrypted_forename = xor_encrypt(data['employee_forename'])
    encrypted_surname = xor_encrypt(data['employee_surname'])
    encrypted_email = xor_encrypt(data['employee_email'])
    encrypted_password = xor_encrypt(data['employee_password'])
    role = data['employee_role']  # Not encrypted
    employee_wage = data['employee_wage']  # Not encrypted

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if email already exists
        cursor.execute("SELECT email FROM users")
        all_emails = cursor.fetchall()
        for (stored_email,) in all_emails:
            if xor_decrypt(stored_email) == data['employee_email']:
                return jsonify({"message": "Email already exists"}), 400

        # Get next employee ID
        cursor.execute("SELECT MAX(employee_id) FROM users")
        max_employee_id = cursor.fetchone()[0]
        next_employee_id = max_employee_id + 1 if max_employee_id else 1

        # Insert into users table
        cursor.execute(""" 
            INSERT INTO users (employee_id, email, password, employee_forename, employee_surname, role)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (next_employee_id, encrypted_email, encrypted_password, encrypted_forename, encrypted_surname, role))

        # Insert into employee_pay table
        cursor.execute(""" 
            INSERT INTO employee_pay (employee_id, employee_wage)
            VALUES (%s, %s)
        """, (next_employee_id, employee_wage))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Employee added successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error adding employee"}), 500

@app.route('/get_employee/<email>', methods=['GET'])
def get_employee(email):
    """
    Retrieve one employee by email (unencrypted in URL)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT employee_forename, employee_surname, email, password, role 
            FROM users
        """)
        results = cursor.fetchall()

        for row in results:
            forename, surname, enc_email, enc_password, role = row
            decrypted_email = xor_decrypt(enc_email)

            if decrypted_email == email:
                return jsonify({
                    "employee_forename": xor_decrypt(forename),
                    "employee_surname": xor_decrypt(surname),
                    "email": decrypted_email,
                    "decrypted_password": xor_decrypt(enc_password),
                    "role": xor_decrypt(role)
                })

        return jsonify({"message": "Employee not found"}), 404

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error retrieving employee"}), 500

@app.route('/get_all_employees', methods=['GET'])
def get_all_employees():
    """
    Retrieve all employee records, decrypting the fields
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT u.employee_id, u.employee_forename, u.employee_surname, u.email, u.password, u.role, p.employee_wage
            FROM users u
            LEFT JOIN employee_pay p ON u.employee_id = p.employee_id
        """)
        rows = cursor.fetchall()

        employees = []
        for row in rows:
            emp_id, enc_forename, enc_surname, enc_email, enc_password, enc_role, wage = row

            employee = {
                "employee_id": emp_id,
                "employee_forename": xor_decrypt(enc_forename),
                "employee_surname": xor_decrypt(enc_surname),
                "email": xor_decrypt(enc_email),
                "password": xor_decrypt(enc_password),
                "role": xor_decrypt(enc_role),
                "employee_wage": wage
            }
            employees.append(employee)

        return jsonify(employees)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error retrieving employees"}), 500

if __name__ == '__main__':
    app.run(port=5001)
