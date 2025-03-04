import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection

app = Flask(__name__)  # Define the Flask app

def getClients():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
             SELECT c.id, c.company_name, cb.client_billing_schedule, cb.client_payment_amount
             FROM clients c
             JOIN client_billing cb ON cb.client_id = c.id
             ORDER BY c.id
        """)

        clients = cursor.fetchall()
        conn.close()

        # Log the fetched data
        print("Fetched clients data:", clients)

        response = [
            {
                "client_id": client[0],
                "company_name": client[1],
                "client_billing_schedule": client[2],
                "client_payment_amount": client[3]
            }
            for client in clients
        ]

        return jsonify(response)

    except Exception as e:
        print(f"Error fetching clients: {e}")
        return jsonify({'error': 'Error fetching clients'}), 500



if __name__ == '__main__':
    app.run(port=5001)
