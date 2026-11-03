import json
from app.config import get_dynamo_resource,DYNAMO_TABLE


def guardar_comprobante(item: dict) -> dict:
    #Inserta un comprobante en la BD.
    #Para evitar el error de floats de boto3 se convierte 'textract_data'
    #a una cadena JSON antes de insertar y devuelve el item con el dict intacto.
    dynamo = get_dynamo_resource()
    table = dynamo.Table(DYNAMO_TABLE)

    item_serializado = dict(item)
    if "textract_data" in item_serializado:
        if isinstance(item_serializado["textract_data"], (dict, list)):
            item_serializado["textract_data"] = json.dumps(
                item_serializado["textract_data"],
                ensure_ascii=False
            )

    table.put_item(Item=item_serializado)

    resultado= dict(item)
    if isinstance(resultado.get("textract_data"), str):
        resultado["textract_data"]  = json.loads(resultado["textract_data"])
    return resultado


def listar_comprobantes() -> list[dict]:
    #Obtiene todos los comprobantes de la BD, deserializa textract_data
    dynamo = get_dynamo_resource()
    table = dynamo.Table(DYNAMO_TABLE)
    response = table.scan()
    items = response.get("Items", [])

    for item in items:
        if "textract_data" in item and isinstance(item["textract_data"], str):
            try:
                item["textract_data"] = json.loads(item["textract_data"])
            except Exception:
                pass

    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items


def obtener_comprobante(comprobante_id: str) -> dict | None:
    dynamo = get_dynamo_resource()
    table = dynamo.Table(DYNAMO_TABLE)
    response = table.get_item(Key={"id": comprobante_id})
    item = response.get("Item")
    if not item:
        return None

    if "textract_data" in item and isinstance(item["textract_data"], str):
        try:
            item["textract_data"] = json.loads(item["textract_data"])
        except Exception:
            pass
    return item


def eliminar_comprobante(comprobante_id: str) -> None:
    dynamo = get_dynamo_resource()
    table =dynamo.Table(DYNAMO_TABLE)
    table.delete_item(Key={"id": comprobante_id})

