import psycopg2
from flask import Flask, jsonify, request
from python.current_reports.current_reports import fetch_client_data, process_client_data, calculate_profit_loss, prepare_final_data
from python.current_reports.monthly_details import fetch_monthly_report


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





if __name__ == '__main__':
    app.run(port=5001)
