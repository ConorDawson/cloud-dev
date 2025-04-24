from flask import Flask
import psycopg2
import os

app = Flask(__name__)

# Load environment variables (same as JavaScript)
DB_CONFIG = {
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "express-finance-db.c500oesmmplc.eu-north-1.rds.amazonaws.com"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_DATABASE", "postgres"),
    "sslmode": "require"  # Ensures SSL is used if required
}

def get_db_connection():
    """
    Establish a connection to the PostgreSQL database
    """
    try:
        conn = psycopg2.connect(
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            sslmode=DB_CONFIG["sslmode"]
        )
        return conn
    except psycopg2.Error as e:
        print("Database connection error:", e)
        return None

# Test connection
if __name__ == "__main__":
    conn = get_db_connection()
    if conn:
        print(" Database connection successful!")
        conn.close()
    else:
        print("Database connection failed.")

