import pandas as pd
import psycopg2
from psycopg2 import sql, OperationalError, Error

# Replace these with your actual DB connection details
DB_HOST = 'cloud-dspm-db.c3qayc8aagwb.us-west-1.rds.amazonaws.com'
DB_NAME = 'postgres'
# DB_NAME = 'db2'
DB_USER = 'adminuser'
DB_PASSWORD = 'dbpassword'
DB_PORT = 5432

# CSV file path
# CSV_FILE = 'mock_data.csv'
CSV_FILE = 'realistic_dspm_dataset.csv'


def main():
    try:
        df = pd.read_csv(CSV_FILE, encoding = 'latin1')
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        cur = conn.cursor()
        print("Connected to the database successfully.")
    except OperationalError as e:
        print(f"Could not connect to the database: {e}")
        return

    try:
        for idx, row in df.iterrows():
            cur.execute(
                "INSERT INTO customers (name, email) VALUES (%s, %s)",
                (row['Name'], row['Email'])
            )
            cur.execute(
                "INSERT INTO leads (phone_number) VALUES (%s)",
                (row['Phone'],)
            )
            cur.execute(
                "INSERT INTO credit_cards (cc_number) VALUES (%s)",
                (row['Credit Card'],)
            )
            cur.execute(
                "INSERT INTO health_info (diagnosis) VALUES (%s)",
                (row['Medical Diagnosis'],)
            )
            cur.execute(
                "INSERT INTO chat_logs (api_key) VALUES (%s)",
                (row['API Key'],)
            )
            cur.execute(
                "INSERT INTO ssn_data (ssn) VALUES (%s)",
                (row['SSN'],)
            )
            if (idx + 1) % 100 == 0:
                print(f"{idx + 1} rows inserted...")

        conn.commit()
        print("All data inserted successfully!")
    except Error as e:
        print(f"Error inserting data: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    main()