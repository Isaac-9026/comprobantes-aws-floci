import sys
from pathlib import Path
from botocore.exceptions import ClientError

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import (
    get_s3_client,
    get_dynamo_resource,
    S3_BUCKET,
    DYNAMO_TABLE,
    AWS_REGION,
)

def init_aws_resources():
    #Inicializa los recursos necesarios en AWS(tanto Floci como AWS Real)::
    #Bucket S3 si no existe.
    #tabla dynamoDB con clave primaria 'id' si no existe.

    # 1. Verificar y crear bucket S3
    s3 = get_s3_client()
    try:
        s3.head_bucket(Bucket=S3_BUCKET)
        print(f"[S3] El bucket '{S3_BUCKET}' ya existe.")
    except ClientError:
        print(f"[S3] Creando bucket '{S3_BUCKET}' en región '{AWS_REGION}'...")
        if AWS_REGION == "us-east-1":
            s3.create_bucket(Bucket=S3_BUCKET)
        else:
            s3.create_bucket(
                Bucket=S3_BUCKET,
                CreateBucketConfiguration={"LocationConstraint": AWS_REGION},
            )
        print(f"[S3] Bucket '{S3_BUCKET}' creado con éxito.")

    # 2. Verificar y crear tabla DynamoDB
    dynamo = get_dynamo_resource()
    existing_tables = [t.name for t in dynamo.tables.all()]
    if DYNAMO_TABLE in existing_tables:
        print(f"[DynamoDB] La tabla '{DYNAMO_TABLE}' ya existe.")
    else:
        print(f"[DynamoDB] Creando tabla '{DYNAMO_TABLE}'...")
        table = dynamo.create_table(
            TableName=DYNAMO_TABLE,
            KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        table.wait_until_exists()
        print(f"[DynamoDB] Tabla '{DYNAMO_TABLE}' creada con éxito.")

if __name__ == "__main__":
    init_aws_resources()
