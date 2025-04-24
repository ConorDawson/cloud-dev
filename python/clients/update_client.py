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

@app.route('/update_client', methods=['POST'])
def update_client():
    data = request.get_json()

    # Encrypt the updated client data
    encrypted_company_name = xor_encrypt(data['company_name'])
    encrypted_contact_person = xor_encrypt(data['contact_person'])
    encrypted_email = xor_encrypt(data['email'])
    encrypted_phone_number = xor_encrypt(data['phone_number'])
    encrypted_city = xor_encrypt(data['city'])
    encrypted_country = xor_encrypt(data['country'])
    client_payment_amount = data['client_payment_amount']  # Not encrypted
    client_billing_schedule = data['client_billing_schedule']  # Not encrypted
    client_id = data['client_id']

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update the clients table
        cursor.execute("""
            UPDATE clients
            SET company_name = %s, contact_person = %s, email = %s, phone_number = %s, city = %s, country = %s
            WHERE id = %s
        """, (encrypted_company_name, encrypted_contact_person, encrypted_email, encrypted_phone_number, encrypted_city, encrypted_country, client_id))

        # Update the client_billing table
        cursor.execute("""
            UPDATE client_billing
            SET client_payment_amount = %s, client_billing_schedule = %s
            WHERE client_id = %s
        """, (client_payment_amount, client_billing_schedule, client_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Client updated successfully"}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error updating client"}), 500

if __name__ == '__main__':
    app.run(port=5001)
