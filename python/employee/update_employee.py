import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime
from python.database import get_db_connection

def parse_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
    
def parse_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def update_employee(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        print("Data in update_employee", data)
        
        email = data.get('email')
        employee_forename = data.get('employee_forename')
        employee_surname = data.get('employee_surname')
        role = data.get('role')
        employee_wage =  parse_float(data.get('employee_wage'))
        employee_id = parse_int(data.get('employee_id'))
        print("Reached update_employee")

        cursor.execute("""
            UPDATE users
            SET email = %s, employee_forename = %s, employee_surname = %s, role = %s
            WHERE employee_id = %s
        """, (email, employee_forename, employee_surname, role, employee_id))

        cursor.execute("""
            UPDATE employee_pay
            SET employee_wage = %s
            WHERE employee_id = %s
        """, (employee_wage, employee_id))

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()