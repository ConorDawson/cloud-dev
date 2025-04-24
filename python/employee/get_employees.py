import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection

# Encryption key for XOR cipher (same as used for encryption)
ENCRYPTION_KEY = 5

def xor_decrypt(cipher_text):
    """
    Decrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in cipher_text)

def getEmployees():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT u.employee_id, u.email, u.password, u.employee_forename, 
                   u.employee_surname, u.role, ep.employee_wage
            FROM users u
            JOIN employee_pay ep ON u.employee_id = ep.employee_id
            ORDER BY u.employee_id
        """)
        
        employees = cursor.fetchall()
        conn.close()

        response = [
            {
                "employee_id": emp[0],
                "email": xor_decrypt(emp[1]),  # Decrypting email
                "employee_forename": xor_decrypt(emp[3]),  # Decrypting forename
                "employee_surname": xor_decrypt(emp[4]),  # Decrypting surname
                "role": emp[5],
                "wage": emp[6]
            }
            for emp in employees
        ]

        return jsonify(response)

    except Exception as e:
        print(f"Error fetching employees: {e}")
        return jsonify({'error': 'Error fetching employees'}), 500

if __name__ == '__main__':
    app.run(port=5001)
