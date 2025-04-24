import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection

def getEmployeeReportWorkYears():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        print("Reached getEmployeeWorkYears")

        # Query to get all distinct years worked
        cursor.execute("""
            SELECT DISTINCT EXTRACT(YEAR FROM work_date) AS year
            FROM timesheet_hours2
            ORDER BY year DESC;
        """)

        #
        years = [row[0] for row in cursor.fetchall()]  

        if years:
            return years 
        else:
            return jsonify({'error': 'No work records found for years'}), 404

    except Exception as e:
        print("Error fetching data:", e)
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        if conn:
            conn.close()
