import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection

def getEmployeeIDs():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT employee_id FROM users ORDER BY employee_id ASC")
        employee_ids = [row[0] for row in cursor.fetchall()] 
        return employee_ids 

    except Exception as e:
        print("Error fetching data:", e)
        return jsonify({'error': 'Internal Server Error'}), 500

    finally:
        if conn:
            conn.close()
    

