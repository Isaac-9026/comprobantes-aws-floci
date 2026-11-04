import os
from pathlib import Path
from dotenv import load_dotenv
import boto3

# cargar la variable de entorno.
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

#Si AWS_ENDPOINT_URL está vacio o no se define,se asigna None para apuntar a AWS Real
raw_endpoint = os.getenv("AWS_ENDPOINT_URL", "").strip()
AWS_ENDPOINT_URL = raw_endpoint if raw_endpoint else None

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "test")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

# Soporte para credenciales temporales (AWS Academy / Learner Lab / SSO)
raw_token = os.getenv("AWS_SESSION_TOKEN", "").strip()
AWS_SESSION_TOKEN = raw_token if raw_token else None

S3_BUCKET = os.getenv("S3_BUCKET", "comprobantes-bucket")
DYNAMO_TABLE = os.getenv("DYNAMO_TABLE", "Comprobantes")

def get_s3_client():
    kwargs = {
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
    }
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    if AWS_SESSION_TOKEN:
        kwargs["aws_session_token"] = AWS_SESSION_TOKEN
    return boto3.client("s3", **kwargs)

def get_dynamo_resource():
    kwargs = {
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
    }
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] =  AWS_ENDPOINT_URL
    if AWS_SESSION_TOKEN:
        kwargs["aws_session_token"] = AWS_SESSION_TOKEN
    return boto3.resource("dynamodb", **kwargs)

def get_textract_client() :
    kwargs = {
        "region_name": AWS_REGION,
        "aws_access_key_id": AWS_ACCESS_KEY_ID,
        "aws_secret_access_key": AWS_SECRET_ACCESS_KEY,
    }
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    if AWS_SESSION_TOKEN:
        kwargs["aws_session_token"] = AWS_SESSION_TOKEN
    return boto3.client("textract", **kwargs)
