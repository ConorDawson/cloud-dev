from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection  # Make sure this is the correct import path for your get_db_connection

app = Flask(__name__)  # Define the Flask app

# XOR decryption key
ENCRYPTION_KEY = 5

def xor_decrypt(cipher_text):
    """
    Decrypt a string using XOR cipher
    """
    return ''.join(chr(ord(char) ^ ENCRYPTION_KEY) for char in cipher_text)

@app.route('/get_clients', methods=['GET'])
def getClients():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
             SELECT c.id, c.company_name, cb.client_billing_schedule, cb.client_payment_amount,
                    contact_person, email, phone_number, city, country
             FROM clients c
             JOIN client_billing cb ON cb.client_id = c.id
             ORDER BY c.id
        """)

        clients = cursor.fetchall()
        conn.close()

        # Decrypt and format response
        response = [
            {
                "client_id": client[0],
                "company_name": xor_decrypt(client[1]),
                "client_billing_schedule": client[2],
                "client_payment_amount": client[3],
                "contact_person": xor_decrypt(client[4]),
                "email": xor_decrypt(client[5]),
                "phone_number": xor_decrypt(client[6]),  # Remove xor_decrypt if not encrypted
                "city": xor_decrypt(client[7]),
                "country": xor_decrypt(client[8])
            }
            for client in clients
        ]

        return jsonify(response)

    except Exception as e:
        print(f"Error fetching clients: {e}")
        return jsonify({'error': 'Error fetching clients'}), 500

if __name__ == '__main__':
    app.run(port=5001)
