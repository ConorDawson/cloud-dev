import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection

app = Flask(__name__)

def xor_decrypt(text, key=5):
    """ XOR decryption for the encrypted text. """
    return ''.join([chr(ord(char) ^ key) for char in text])

def get_individual_employee(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Retrieve employee ID from request data
        id = data.get('id')

        # Validate input
        if not id:
            return {'error': 'Missing employee ID'}

        # Correct SQL query
        query = """
            SELECT users.employee_forename, users.employee_surname, users.email, users.role, employee_pay.employee_wage
            FROM users
            JOIN employee_pay ON employee_pay.employee_id = users.employee_id
            WHERE users.employee_id = %s
        """

        cursor.execute(query, (id,))
        employee_data = cursor.fetchall()

        # Decrypt the sensitive fields
        decrypted_employee_data = [
            (xor_decrypt(forename), xor_decrypt(surname), xor_decrypt(email), role, wage)
            for forename, surname, email, role, wage in employee_data
        ]

        return {'employee_data': decrypted_employee_data}  # ✅ Returning a dictionary instead of jsonify()
    
    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}
    
    finally:
        if conn:
            conn.close()
