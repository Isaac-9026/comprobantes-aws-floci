from app.config import get_s3_client, S3_BUCKET

def subir_imagen(file_bytes: bytes, s3_key: str, content_type: str) -> None:
    s3 = get_s3_client()
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
    )

def obtener_imagen(s3_key: str) -> tuple[bytes, str]:
    s3 = get_s3_client()
    response = s3.get_object(Bucket=S3_BUCKET, Key=s3_key)
    body_bytes = response["Body"].read()
    content_type = response.get("ContentType", "image/jpeg")
    return body_bytes, content_type

def eliminar_imagen(s3_key: str) -> None:
    s3 = get_s3_client()
    s3.delete_object(Bucket=S3_BUCKET, Key=s3_key)

