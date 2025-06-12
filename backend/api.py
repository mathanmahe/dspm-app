import psycopg2
import re
import json
import os
import uuid
import boto3
from fastapi import FastAPI, HTTPException, Query
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

'''Local testing'''
# Load scan_results.json once at startup
# DATA_FILE = os.path.join(os.path.dirname(__file__), "../output/scan_results.json")

# if not os.path.exists(DATA_FILE):
#     raise FileNotFoundError(f"{DATA_FILE} does not exist. Please run scanner first.")

# with open(DATA_FILE, 'r') as f:
#     data = json.load(f)

# findings = data.get("findings", [])

# Database credentials
# DB_HOST = 'cloud-dspm-db.c3qayc8aagwb.us-west-1.rds.amazonaws.com'
# DB_NAME = 'postgres'
# DB_USER = 'adminuser'
# DB_PASSWORD = 'dbpassword'
# DB_PORT = 5432

'''Local Testing'''

# Load config from environment variables (Copilot injects these automatically)
DB_HOST = os.environ['DB_HOST']
DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
DB_PASSWORD = os.environ['DB_PASSWORD']
DB_PORT = int(os.environ.get('DB_PORT', 5432))

S3_BUCKET = os.environ['S3_BUCKET']
S3_KEY_PREFIX = os.environ.get('S3_KEY_PREFIX', 'scanner-output')
S3_KEY = f"{S3_KEY_PREFIX}/scan_results.json"

# Create S3 client
s3_client = boto3.client('s3')

# Load scan_results.json from S3 at startup
try:
    s3_obj = s3_client.get_object(Bucket=S3_BUCKET, Key=S3_KEY)
    data = json.loads(s3_obj['Body'].read())
    findings = data.get("findings", [])
except Exception as e:
    # raise FileNotFoundError(f"Could not load scan_results.json from S3: {e}")
    print(f"Warning: Could not load scan_results.json from S3: {e}")
    findings = []


# Regex definitions
REGEXES = {
    'Email': r'[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+',
    'SSN': r'\b\d{3}-\d{2}-\d{4}\b',
    'Phone': r'(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}',
    'Credit Card': r'\b(?:\d[ -]*?){13,16}\b',
    'API Key': r'([a-zA-Z0-9]{24,})|(sk_live_[a-zA-Z0-9]{24,})|(AKIA[0-9A-Z]{16})'
}

# Redaction helper
def redact(value: str, data_type: str):
    if data_type == "Email":
        parts = value.split("@")
        return parts[0][:2] + "***@" + parts[1]
    if data_type == "SSN":
        return "***-**-" + value[-4:]
    if data_type == "Credit Card":
        return "****-****-****-" + value[-4:]
    if data_type == "Phone":
        return "***-***-" + value[-4:]
    if data_type == "API Key":
        return "******" + value[-10:]
    return "***REDACTED***"

# DB connector
def connect_db():
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    return conn

@app.get("/")
def healthcheck():
    return {"status": "ok"}


# GET /findings route
@app.get("/findings")
def get_findings(
    sensitivity: Optional[str] = None,
    data_type: Optional[str] = None,
    table: Optional[str] = None,
    confidence_min: float = 0,
    confidence_max: float = 1
):
    filtered = []
    for finding in findings:
        if sensitivity and sensitivity != finding['classification']['sensitivity']:
            continue
        if data_type and data_type not in finding['classification']['data_types']:
            continue
        if table and table != finding['datastore']['table']:
            continue
        conf = finding['classification']['confidence']
        if not (confidence_min <= conf <= confidence_max):
            continue
        filtered.append(finding)

    return {
        "metadata": {
            "total": len(filtered),
            "page": 1,
            "pageSize": len(filtered),
            "hasNextPage": False
        },
        "findings": filtered
    }

# GET /summary route
@app.get("/summary")
def get_summary():
    summary = {
        "total_findings": len(findings),
        "data_types": {},
        "sensitivity": {}
    }
    for f in findings:
        for dt in f["classification"]["data_types"]:
            count = f["classification"]["match_count"]
            summary["data_types"][dt] = summary["data_types"].get(dt, 0) + count
        sens = f["classification"]["sensitivity"]
        summary["sensitivity"][sens] = summary["sensitivity"].get(sens, 0) + 1
    return summary

# GET /findings/{id} route
@app.get("/findings/{finding_id}")
def get_finding(finding_id: str):
    for f in findings:
        if f["id"] == finding_id:
            return f
    raise HTTPException(status_code=404, detail="Finding not found")

# GET /datastore/{table}/{column} route
@app.get("/datastore/{table}/{column}")
def get_column_samples(
    table: str,
    column: str,
    data_type: Optional[str] = None,
    limit: int = 50
):
    conn = connect_db()
    cursor = conn.cursor()
    query = f'SELECT "{column}" FROM "{table}" LIMIT {limit};'
    try:
        cursor.execute(query)
        rows = [str(row[0]) for row in cursor.fetchall() if row[0] is not None]
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

    matches = []
    if data_type and data_type in REGEXES:
        pattern = re.compile(REGEXES[data_type])
        for row in rows:
            if pattern.search(row):
                matches.append({
                    "raw": row,
                    "redacted": redact(row, data_type)
                })
    else:
        matches = [{"raw": row, "redacted": "***"} for row in rows]

    return {"samples": matches[:limit]}
