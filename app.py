import psycopg2
from flask import Flask, jsonify, request
from python.current_reports.current_reports import fetch_client_data, process_client_data, calculate_profit_loss, prepare_final_data
from python.current_reports.monthly_details import fetch_monthly_report
from python.timesheet.timesheet import submit_timesheet
from python.employee.add_employee import add_new_employee
from python.employee.get_employees import getEmployees
from python.employee.update_employee import update_employee
from python.employee.delete_employee import delete_employee


app = Flask(__name__)




@app.route('/api/client_hours', methods=['GET'])
def get_client_hours():
    """
    Fetches all necessary data from the database for each client based on the selected date range,
    and calculates total hours worked, cost, and profit/loss %.
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    try:
        # Step 1: Fetch all necessary data from the database
        rows = fetch_client_data(start_date, end_date)
        # Step 2: Process the data and calculate totals
        client_data = process_client_data(rows)
        # Step 3: Calculate profit/loss for each client
        client_data = calculate_profit_loss(client_data, start_date, end_date)
        # Step 4: Prepare final data for the response
        response_data = prepare_final_data(client_data)

        return jsonify(response_data)

    except Exception as e:
        print(f"Error fetching or processing data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500
    
@app.route('/api/monthly_report', methods=['GET'])
def get_monthly_report():
    client = request.args.get('client')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not client or not start_date or not end_date:
        return jsonify({"error": "Client, Start Date, and End Date parameters are required"}), 400

    try:
        response_data = fetch_monthly_report(client, start_date, end_date)
        return response_data  # Assuming response_data is already a JSON response

    except Exception as e:
        print(f"Error fetching or processing data: {e}")
        return jsonify({'error': 'Error fetching data'}), 500


@app.route('/submitTimesheet', methods=['POST'])
def submit_timesheet_route():
    return submit_timesheet()  # Call function from timesheet.py


@app.route('/add_new_employee', methods=['POST'])
def insert_employee():
     return add_new_employee()


@app.route('/getAllEmployees', methods=['GET'])
def get_all_employees():
    response_data =getEmployees()
    return response_data

@app.route('/update_employee', methods=['POST'])
def save_update_employee():
    print("reached app.py")
    data = request.get_json()  # Get the JSON data sent from the client
    print("Received data:", data)
    
    try:
        update_employee(data)
        return jsonify({"message": "Employee updated successfully"}), 200
    except Exception as e:
        print(f"Error updating employee: {e}")
        return jsonify({"message": "Error updating employee"}), 500
    
@app.route('/delete_employee', methods=['POST'])
def call_delete_employee():
    data = request.get_json()
    print("Received data:", data)
    
    try:
        delete_employee(data)
        return jsonify({"message": "Employee deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting employee: {e}")
        return jsonify({"message": "Error deleting employee"}), 500
    
if __name__ == '__main__':
    app.run(port=5001)
