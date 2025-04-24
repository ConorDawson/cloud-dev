from flask import request
from python.database import get_db_connection

def xor_decrypt(text, key=5):
    return ''.join([chr(ord(char) ^ key) for char in text])

def get_billing_cycles_per_year(billing_schedule):
    """
    Return number of billing cycles in 12 months for the given schedule.
    """
    if billing_schedule == 'A':    # Annual
        return 1
    elif billing_schedule == 'BA':  # Biannual
        return 2
    elif billing_schedule == 'Q':   # Quarterly
        return 4
    elif billing_schedule == 'M':   # Monthly
        return 12
    else:
        return 0  # Unknown schedule

def fetch_client_payments():
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
    SELECT client_id, client_payment_amount, client_billing_schedule, c.company_name
    FROM client_billing cb
    LEFT JOIN clients c ON cb.client_id = c.id
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()

    payments = []
    for row in rows:
        client_id, payment_amount, billing_schedule, encrypted_name = row
        decrypted_name = xor_decrypt(encrypted_name) if encrypted_name else None
        payment_amount = payment_amount or 0  # Fallback for None

        billing_cycles = get_billing_cycles_per_year(billing_schedule)
        total_payment = payment_amount * billing_cycles

        payments.append({
            "client_id": client_id,
            "client_payment_amount": total_payment,
            "client_billing_schedule": billing_schedule,
            "company_name": decrypted_name
        })

    cursor.close()
    conn.close()
    
    return payments
