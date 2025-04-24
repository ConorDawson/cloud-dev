import psycopg2
from flask import Flask, jsonify, request
from psycopg2.extras import execute_values

# Encryption key
ENCRYPTION_KEY = 5

# XOR encryption/decryption functions
def xor_encrypt(text):
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in text)

def xor_decrypt(cipher_text):
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in cipher_text)

# Database connection info
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "postgres"
}

app = Flask(__name__)

@app.route('/submit-timesheet', methods=['POST'])
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

        # Encrypt the company names
        values = [
            (
                xor_encrypt(entry['clientName']),
                float(entry['hours']),
                entry['date'],
                int(entry['employee_id'])
            )
            for entry in timesheet_data
        ]

        execute_values(cur, query, values)
        conn.commit()

        result = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify({
            "message": "Timesheet submitted successfully",
            "data": result
        }), 200

    except Exception as e:
        print("Database error:", str(e))
        return jsonify({
            "error": "Database error",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(port=5001)
