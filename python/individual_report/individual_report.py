import psycopg2
from flask import Flask, jsonify, request
from python.database import get_db_connection

app = Flask(__name__)

def getEmployeeWorkYears(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        print("Reached getEmployeeWorkYears")

        # Query to get all distinct years worked
        cursor.execute("""
            SELECT DISTINCT EXTRACT(YEAR FROM work_date) AS year
            FROM timesheet_hours2
            WHERE employee_id = %s
            ORDER BY year DESC;
        """, (employee_id,))

        # Fetch all results
        years = [row[0] for row in cursor.fetchall()]  # Convert to list

        if years:
            return jsonify({'work_years': years})  # Return list of years
        else:
            return jsonify({'error': 'No work records found for employee'}), 404

    except Exception as e:
        print("Error fetching data:", e)
        return jsonify({'error': 'Internal Server Error'}), 500
    finally:
        if conn:
            conn.close()




def get_client_hours_for_employee(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        year = data.get('year')
        print("Reached get_client_hours")

        cursor.execute("""
            SELECT
                th.company_name,
                SUM(th.hours) as total_hours
            FROM timesheet_hours2 th
            WHERE th.employee_id = %s AND EXTRACT(YEAR FROM th.work_date) = %s
            GROUP BY th.company_name;
        """, (employee_id, year))

        client_hours = cursor.fetchall()
        print(client_hours)

        if client_hours:
            return {'client_hours': client_hours}  # Return a dictionary, not jsonify()
        else:
            return {'error': 'No client hours found for employee'}

    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}  # Return a dictionary
    
    finally:
        if conn:
            conn.close()

            
def get_individual_monthly_report(data):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        employee_id = data.get('employee_id')
        year = data.get('year')
        company_name = data.get('company_name')
        print("Reached get_individual_monthly_report")

        cursor.execute("""
            SELECT
                EXTRACT(MONTH FROM th.work_date) AS month,
                SUM(th.hours) AS total_hours
            FROM timesheet_hours2 th
            WHERE th.employee_id = %s 
                AND EXTRACT(YEAR FROM th.work_date) = %s 
                AND th.company_name = %s
            GROUP BY EXTRACT(MONTH FROM th.work_date)
            ORDER BY month;
        """, (employee_id, year, company_name))

        monthly_report = cursor.fetchall()
        print(monthly_report)

        # List of month names
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        # Prepare a dictionary to map month names to their respective hours
        report_data = []
        for month, total_hours in monthly_report:
            month_name = month_names[int(month) - 1]  # Convert month number to month name
            report_data.append({ 'month': month_name, 'total_hours': total_hours })

        if report_data:
            return {'monthly_report': report_data}  # Return the structured report
        else:
            return {'error': 'No monthly report found for employee'}

    except Exception as e:
        print("Error fetching data:", e)
        return {'error': 'Internal Server Error'}  # Return a dictionary
    
    finally:
        if conn:
            conn.close()


