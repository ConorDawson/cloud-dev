import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection


# Encryption key for XOR cipher
ENCRYPTION_KEY = 5

app = Flask(__name__)


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

@app.route('/add_new_client', methods=['POST'])
def add_new_client():
    data = request.get_json()

    # Encrypt the input data
    encrypted_company_name = xor_encrypt(data['company_name'])
    encrypted_contact_person = xor_encrypt(data['contact_person'])
    encrypted_email = xor_encrypt(data['email'])
    encrypted_phone_number = xor_encrypt(data['phone_number'])
    encrypted_city = xor_encrypt(data['city'])
    encrypted_country = xor_encrypt(data['country'])
    client_payment_amount = data['client_payment_amount']  # Not encrypted
    client_billing_schedule = data['client_billing_schedule']  # Not encrypted

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert into clients table
        cursor.execute("""
            INSERT INTO clients (company_name, contact_person, email, phone_number, city, country)
            VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
        """, (encrypted_company_name, encrypted_contact_person, encrypted_email, encrypted_phone_number, encrypted_city, encrypted_country))

        # Get the generated client_id from the inserted record
        client_id = cursor.fetchone()[0]

        # Insert into client_billing table
        cursor.execute("""
            INSERT INTO client_billing (client_id, client_payment_amount, client_billing_schedule)
            VALUES (%s, %s, %s)
        """, (client_id, client_payment_amount, client_billing_schedule))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Client added successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error adding client"}), 500

if __name__ == '__main__':
    app.run(port=5001)
