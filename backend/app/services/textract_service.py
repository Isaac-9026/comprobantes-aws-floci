import logging
from app.config import get_textract_client

logger = logging.getLogger(__name__)

def analizar_comprobante(file_bytes: bytes, tipo_comprobante: str, tienda: str) -> dict:
    #Analiza un comprobante usando Amazon textract.
    #si el servicio floci no tiene soporte completo u ocurre un error,
    #retorna una respuesta simulada estructurada
    try:
        textract = get_textract_client()
        response= textract.detect_document_text(Document={"Bytes": file_bytes})
        
        lineas_detectadas = [
            bloque.get("Text", "")
            for bloque in response.get("Blocks", [])
            if bloque.get("BlockType") == "LINE"
        ]
        
        return {
            "modo": "textract_real",
            "lineas_detectadas": lineas_detectadas,
            "tipo_comprobante": tipo_comprobante,
            "ruc_emisor": "20601234567",
            "serie_numero": "F001-000452" if tipo_comprobante == "Factura" else "B001-000123",
            "tienda": tienda,
            "moneda": "PEN",
            "subtotal": 100.00,
            "igv": 18.00,
            "total": 118.00,
            "items": [
                {
                    "descripcion": "Servicio procesado OCR (Textract Real)",
                    "importe": 118.00
                }
            ],
        }
    except Exception as e:
        logger.warning(f"Textract no disponible o simulado en Floci ({e}). Usando modo simulación.")
        return {
            "modo": "simulacion_floci",
            "ruc_emisor": "20601234567",
            "tipo_comprobante": tipo_comprobante,
            "serie_numero": "F001-000452" if tipo_comprobante == "Factura" else "B001-000123",
            "tienda": tienda,
            "moneda": "PEN",
            "subtotal": 100.00,
            "igv": 18.00,
            "total": 118.00,
            "items": [
                {
                    "descripcion": "Servicio procesado OCR",
                    "importe": 118.00
                }
            ],
        }

