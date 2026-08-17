import os

import psycopg2
from dotenv import load_dotenv


# Load AI service .env
load_dotenv()


def get_connection():
    """
    Connect to the same PostgreSQL database used by the Node backend.
    """

    # Option 1: complete PostgreSQL connection URL
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        return psycopg2.connect(
            database_url
        )

    # Option 2: individual DB_* variables
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )