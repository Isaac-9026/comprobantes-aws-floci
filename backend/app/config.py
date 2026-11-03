import os
from pathlib import Path
from dotenv import load_dotenv
import boto3

# cargar la variable de entorno.
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "test")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "test")
S3_BUCKET = os.getenv("S3_BUCKET", "comprobantes-bucket")
DYNAMO_TABLE = os.getenv("DYNAMO_TABLE", "Comprobantes")

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url= AWS_ENDPOINT_URL,
        region_name= AWS_REGION,
        aws_access_key_id= AWS_ACCESS_KEY_ID,
        aws_secret_access_key= AWS_SECRET_ACCESS_KEY,
    )

def get_dynamo_resource():
    return boto3.resource(
        "dynamodb",
        endpoint_url=AWS_ENDPOINT_URL,
        region_name =AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )

def get_textract_client():
    return boto3.client(
        "textract",
        endpoint_url=AWS_ENDPOINT_URL,
        region_name= AWS_REGION,
        aws_access_key_id = AWS_ACCESS_KEY_ID,
        aws_secret_access_key = AWS_SECRET_ACCESS_KEY,
    )

