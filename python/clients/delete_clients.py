import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection

def delete_client(data):
    client_id = data.get('client_id')
    print("CLient ID in delete_employee", client_id)

    if not client_id:
        return jsonify({"error": "Client ID is required"}), 400
    else:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("DELETE FROM clients WHERE id = %s", (client_id,))
            cursor.execute("DELETE FROM client_billing WHERE client_id = %s", (client_id,))

            conn.commit()
            return jsonify({"message": "Client deleted successfully"})
        except Exception as e:
            conn.rollback()
            return jsonify({"error": "An error occurred while deleting the client"}), 500
        finally:
            conn.close()
            
if __name__ == '__main__':
    app.run(port=5001)