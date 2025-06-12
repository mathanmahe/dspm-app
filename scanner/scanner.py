import psycopg2
import re
import json
import os
import uuid
import boto3

# # DB Credentials — you can load these from env vars later
# DB_HOST = 'cloud-dspm-db.c3qayc8aagwb.us-west-1.rds.amazonaws.com'
# DB_NAME = 'postgres'
# # DB_NAME = 'db2'
# DB_USER = 'adminuser'
# DB_PASSWORD = 'dbpassword'
# DB_PORT = 5432

# Load DB Credentials from env vars (safe for production)
DB_HOST = os.environ.get('DB_HOST')
DB_NAME = os.environ.get('DB_NAME')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_PORT = int(os.environ.get('DB_PORT', '5432'))

# S3 config from env vars
S3_BUCKET = os.environ.get('S3_BUCKET')
S3_KEY_PREFIX = os.environ.get('S3_KEY_PREFIX', 'scanner-output')

s3_client = boto3.client('s3')


# Regex rules for sensitive data detection
REGEXES = {
    'Email': r'[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+',
    'SSN': r'\b\d{3}-\d{2}-\d{4}\b',
    'Phone': r'(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}',
    'Credit Card': r'\b(?:\d[ -]*?){13,16}\b',
    'API Key': r'([a-zA-Z0-9]{24,})|(sk_live_[a-zA-Z0-9]{24,})|(AKIA[0-9A-Z]{16})'
}

# Sensitivity mapping for simplicity
SENSITIVITY_MAP = {
    'Email': 'HIGH',
    'SSN': 'HIGH',
    'Phone': 'MEDIUM',
    'Credit Card': 'CRITICAL',
    'API Key': 'MEDIUM'
}

def connect_db():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    return conn

def discover_tables(conn):
    cursor = conn.cursor()
    query = """
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    """
    cursor.execute(query)
    tables = [row[0] for row in cursor.fetchall()]
    return tables

def get_columns(conn, table_name):
    cursor = conn.cursor()
    query = f"""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = '{table_name}';
    """
    cursor.execute(query)
    columns = [row[0] for row in cursor.fetchall()]
    return columns

def fetch_sample_data(conn, table_name, column_name, limit=1000):
    cursor = conn.cursor()
    query = f'SELECT "{column_name}" FROM "{table_name}" LIMIT {limit};'
    try:
        cursor.execute(query)
        rows = [str(row[0]) for row in cursor.fetchall() if row[0] is not None and str(row[0]).strip() != ''] 
        return rows
    except Exception as e:
        print(f"Error fetching data from {table_name}.{column_name}: {e}")
        return []

def apply_regex_detection(rows):
    matches = {}
    for data_type, pattern in REGEXES.items():
        compiled = re.compile(pattern)
        match_list = [row for row in rows if compiled.search(row)]
        if match_list:
            matches[data_type] = {
                'match_count': len(match_list),
                'sample_values': match_list[:3],  # Take first 3 samples
                'regex_match': True
            }
    return matches

def scan_database():
    conn = connect_db()
    tables = discover_tables(conn)
    findings = []
    finding_counter = 1  

    for table in tables:
        columns = get_columns(conn, table)
        for column in columns:
            rows = fetch_sample_data(conn, table, column)
            matches = apply_regex_detection(rows)

            for data_type, match_info in matches.items():
                finding = {
                    'id': f'finding_{finding_counter}',
                    'datastore': {
                        'type': 'rds',
                        'engine': 'postgresql',
                        'database': DB_NAME,
                        'table': table,
                        'column': column
                    },
                    'classification': {
                        'sensitivity': SENSITIVITY_MAP.get(data_type, 'LOW'),
                        'data_types': [data_type],
                        'regex_match': match_info['regex_match'],
                        'match_count': match_info['match_count'],
                        'sample_values': match_info['sample_values'],
                        'confidence': round(min(1.0, match_info['match_count'] / len(rows) if rows else 0.0), 2)
                    }
                }
                findings.append(finding)

    result = {
        'metadata': {
            'total': len(findings),
            'page': 1,
            'pageSize': len(findings),
            'hasNextPage': False
        },
        'findings': findings
    }

    # Write to JSON file
    # os.makedirs('output', exist_ok=True)
    # with open('output/scan_results.json', 'w') as f:
    #     json.dump(result, f, indent=2)

    # print("Scanning completed. Output written to output/scan_results.json")

    # Upload to S3
    s3_key = f"{S3_KEY_PREFIX}/scan_results.json"
    s3_client.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=json.dumps(result, indent=2).encode('utf-8'))
    print(f"Successfully uploaded scan result to s3://{S3_BUCKET}/{s3_key}")



def upload_to_s3(result):
    s3 = boto3.client('s3')
    key = f"{S3_KEY_PREFIX}/scan_results.json"

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=json.dumps(result, indent=2),
        ContentType='application/json'
    )

    print(f"Successfully uploaded to s3://{S3_BUCKET}/{key}")

if __name__ == '__main__':
    scan_database()
