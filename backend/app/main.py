import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from app.init_aws import init_aws_resources
from app.services.textract_service import analizar_comprobante
from app.services.s3_service import subir_imagen, obtener_imagen, eliminar_imagen
from app.services.dynamo_service import (
    guardar_comprobante,
    listar_comprobantes,
    obtener_comprobante,
    eliminar_comprobante,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    #inicializa los recursos de aws al arrancar el servidor.
    init_aws_resources()
    yield

app = FastAPI(
    title="Api de gestión de comprobantes",
    description="automatizar gestión de comprobantes utilizando AWS emulado con Floci",
    version="1.0.0",
    lifespan=lifespan,
)

# Configuración Obligatoria de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Límites y tipos permitidos
TIPOS_PERMITIDOS = {"Boleta","Factura"}
TIENDAS_PERMITIDAS = {"Chincha","Pisco","Ica"}
CONTENT_TYPES_PERMITIDOS = {"image/jpeg": "jpg", "image/png": "png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # = 5mb.


@app.post("/comprobantes",status_code=201)
def crear_comprobante(
    tipo_comprobante:str = Form(...),
    fecha_emision: str = Form(...),
    usuario: str = Form(...),
    tienda:str = Form(...),
    observacion:str = Form(""),
    imagen: UploadFile = File(...),
):

    # Validaciones
    if tipo_comprobante not in TIPOS_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de comprobante inválido. Debe ser uno de: {list(TIPOS_PERMITIDOS)}",
        )

    if tienda not in TIENDAS_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail=f"Tienda inválida. Debe ser una de: {list(TIENDAS_PERMITIDAS)}",
        )

    if imagen.content_type not in CONTENT_TYPES_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagen inválido. Solo se admiten archivos JPG y PNG.",
        )

    # Lectura de bytes de forma sincrona
    file_bytes = imagen.file.read()
    if len(file_bytes) ==0:
        raise HTTPException(
            status_code=400,
            detail="El archivo de imagen está vacío.",
        )

    if len(file_bytes) > MAX_FILE_SIZE :
        raise HTTPException(
            status_code=400,
            detail="El archivo excede el tamaño máximo permitido de 5MB.",
        )

    #1:Analizar con Textract
    textract_json = analizar_comprobante(file_bytes, tipo_comprobante, tienda)

    #2: Subir imagen a S3
    comprobante_id = str(uuid.uuid4())
    extension = CONTENT_TYPES_PERMITIDOS[imagen.content_type]
    s3_key = f"comprobantes/{comprobante_id}.{extension}"
    subir_imagen(file_bytes, s3_key,imagen.content_type)

    # 3:Construir el diccionario del comprobante
    item = {
        "id": comprobante_id,
        "tipo_comprobante": tipo_comprobante,
        "fecha_emision": fecha_emision,
        "usuario": usuario,
        "tienda": tienda,
        "observacion": observacion,
        "s3_key": s3_key,
        "content_type": imagen.content_type,
        "textract_data": textract_json,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    #4: Guardar en DynamDb con rollback en S3 ante error
    try:
        resultado = guardar_comprobante(item)
        return resultado
    except Exception as e:
        #Rollback: eliminar imagen en S3 en caso falla la base de datos
        eliminar_imagen(s3_key)
        raise HTTPException(
            status_code=500,
            detail=f"Error al guardar comprobante en DynamoDB.Se ejecutó rollback en S3: {str(e)}",
        )


@app.get("/comprobantes")
def obtener_comprobantes():
    return listar_comprobantes()


@app.get("/comprobantes/{comprobante_id}/imagen")
def ver_imagen_comprobante(comprobante_id: str):
    item = obtener_comprobante(comprobante_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró el comprobante con ID '{comprobante_id}'.",
        )

    image_bytes,content_type = obtener_imagen(item["s3_key"])
    return Response(content=image_bytes, media_type=content_type)


@app.delete("/comprobantes/{comprobante_id}")
def borrar_comprobante(comprobante_id: str):
    item = obtener_comprobante(comprobante_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró el comprobante con ID '{comprobante_id}'.",
        )

    # Eliminar recurso en S3 y luego en DynamoDB
    eliminar_imagen(item["s3_key"])
    eliminar_comprobante(comprobante_id)
    return {"mensaje": "El comprobante se ha eliminado correctamente."}

