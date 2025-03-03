import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection


def delete_employee(data):
    employee_id = data.get('employee_id')
    print("Employee ID in delete_employee", employee_id)
    if not employee_id:
        return jsonify({"error": "Employee ID is required"}), 400
    else:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()

            cursor.execute("DELETE FROM users WHERE employee_id = %s", (employee_id,))
            cursor.execute("DELETE FROM employee_pay WHERE employee_id = %s", (employee_id,))

            conn.commit()
            return jsonify({"message": "Employee deleted successfully"})
        except Exception as e:
            conn.rollback()
            return jsonify({"error": "An error occurred while deleting the employee"}), 500
        finally:
            conn.close()
    