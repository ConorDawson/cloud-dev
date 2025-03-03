import psycopg2
from flask import Flask, jsonify, request
from datetime import datetime

# Database connection information
DB_CONFIG = {
    "user": "postgres",
    "password": "postgres",
    "host": "localhost",
    "port": 5432,
    "database": "postgres"
}

app = Flask(__name__)

def get_db_connection():
    """
    Establish a connection to the PostgreSQL database
    """
    conn = psycopg2.connect(
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        database=DB_CONFIG["database"]
    )
    return conn