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

def xor_encrypt(text):
    """
    Encrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in text)


def delete_employee(data):
    employee_id = data.get('employee_id')
    print("Employee ID in delete_employee", employee_id)
    
    if not employee_id:
        return jsonify({"error": "Employee ID is required"}), 400
    else:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            # Fetch the employee's sensitive information before deletion
            cursor.execute("SELECT email, employee_forename, employee_surname FROM users WHERE employee_id = %s", (employee_id,))
            result = cursor.fetchone()

            if result:
                email, forename, surname = result

                # Decrypt the sensitive fields
                decrypted_email = xor_decrypt(email)
                decrypted_forename = xor_decrypt(forename)
                decrypted_surname = xor_decrypt(surname)

                print(f"Employee data before deletion: Email: {decrypted_email}, Forename: {decrypted_forename}, Surname: {decrypted_surname}")

                # Proceed with deletion
                cursor.execute("DELETE FROM users WHERE employee_id = %s", (employee_id,))
                cursor.execute("DELETE FROM employee_pay WHERE employee_id = %s", (employee_id,))

                conn.commit()
                return jsonify({"message": "Employee deleted successfully"})
            else:
                return jsonify({"error": "Employee not found"}), 404

        except Exception as e:
            conn.rollback()
            return jsonify({"error": "An error occurred while deleting the employee"}), 500
        finally:
            conn.close()
