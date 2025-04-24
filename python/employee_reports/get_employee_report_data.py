import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection

app = Flask(__name__)

# XOR decryption function
def xor_decrypt(text, key=5):
    """
    XOR decryption for the encrypted text.
    """
    return ''.join([chr(ord(char) ^ key) for char in text])

# XOR encryption function
def xor_encrypt(text, key=5):
    """
    XOR encryption for the given text.
    """
    return ''.join([chr(ord(char) ^ key) for char in text])

def get_report_data(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        id = data.get('id')
        year = data.get('year')
        print("Reached get_report_data")
        print(id, year)
        cursor.execute("""
            SELECT
                th.company_name,
                SUM(th.hours) as total_hours
            FROM timesheet_hours2 th
            WHERE th.employee_id = %s AND EXTRACT(YEAR FROM th.work_date) = %s
            GROUP BY th.company_name;
        """, (id, year))

        client_hours = cursor.fetchall()
        print(client_hours)

        # Decrypt company names
        decrypted_client_hours = [(xor_decrypt(company_name), total_hours) for company_name, total_hours in client_hours]

        if decrypted_client_hours:
            return {'client_hours': decrypted_client_hours}  
        else:
            return {'error': 'No client hours found for employee'}

    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}  # Return a dictionary
    
    finally:
        if conn:
            conn.close()
