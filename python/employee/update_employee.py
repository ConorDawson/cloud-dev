import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection

# Encryption key for XOR cipher
ENCRYPTION_KEY = 5

def xor_encrypt(text):
    """
    Encrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in text)

def xor_decrypt(cipher_text):
    """
    Decrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in cipher_text)

def parse_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
    
def parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def update_employee(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        print("Data in update_employee", data)
        
        email = data.get('email')
        employee_forename = data.get('employee_forename')
        employee_surname = data.get('employee_surname')
        role = data.get('role')
        employee_wage =  parse_float(data.get('employee_wage'))
        employee_id = parse_int(data.get('employee_id'))
        print("Reached update_employee")

        # Encrypt sensitive data before updating in the database
        encrypted_email = xor_encrypt(email) if email else None
        encrypted_forename = xor_encrypt(employee_forename) if employee_forename else None
        encrypted_surname = xor_encrypt(employee_surname) if employee_surname else None

        # Update user table with encrypted data
        cursor.execute("""
            UPDATE users
            SET email = %s, employee_forename = %s, employee_surname = %s, role = %s
            WHERE employee_id = %s
        """, (encrypted_email, encrypted_forename, encrypted_surname, role, employee_id))

        # Update employee_pay table
        cursor.execute("""
            UPDATE employee_pay
            SET employee_wage = %s
            WHERE employee_id = %s
        """, (employee_wage, employee_id))

        conn.commit()
        return jsonify({"message": "Employee updated successfully"})
    
    except Exception as e:
        conn.rollback()
        print(f"Error during update: {e}")
        return jsonify({"error": "An error occurred while updating the employee"}), 500
    
    finally:
        conn.close()
