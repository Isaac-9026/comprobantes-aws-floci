# App Automatizar Gestión de Comprobantes

> Sistema integral para el registro, análisis OCR, almacenamiento en la nube y persistencia NoSQL de comprobantes fiscales (Boletas y Facturas) para las sedes de **Chincha**, **Pisco** e **Ica**, utilizando servicios emulados de **Amazon Web Services (AWS)** con **Floci** y soporte nativo para **AWS Cloud Real**.

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura de la Solución](#arquitectura-de-la-solución)
- [Servicios AWS Implementados](#servicios-aws-implementados)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos)
- [Guía de Instalación y Ejecución](#guía-de-instalación-y-ejecución)
- [Especificación de la API REST](#especificación-de-la-api-rest)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Interfaz de Usuario (Single-Page Dashboard)](#interfaz-de-usuario-single-page-dashboard)

---

## Descripción General

El proyecto automatiza el flujo completo de digitalización y gestión de comprobantes de pago emitidos en sucursales comerciales. Permite al usuario cargar imágenes de facturas o boletas físicas (JPG/PNG), extraer de forma estructurada sus datos tributarios mediante **Amazon Textract**, almacenar de manera segura el archivo binario en **Amazon S3** y registrar los metadatos junto con la información extraída en una tabla NoSQL de **Amazon DynamoDB**.

### Características Principales:
* **Dashboard Single-Page:** Experiencia de usuario en una sola pantalla con formulario reactivo superior y tabla interactiva inferior.
* **Pipeline Serverless Desacoplado:** Flujo lineal estricto: Validación -> Textract OCR -> S3 Upload -> DynamoDB Save.
* **Tolerancia a Fallos (Rollback Atómico):** Mecanismo de compensación que purga automáticamente el archivo en S3 si ocurre un fallo al persistir en DynamoDB.
* **Soporte Dual (Floci y AWS Real):** Diseñado con el SDK oficial `boto3` para alternar entre el emulador local Floci y cuentas reales de AWS con solo cambiar el archivo `.env`.

---

## Arquitectura de la Solución

El sistema desacopla la capa de presentación (React), la capa de servicios (FastAPI síncrono con Boto3) y la infraestructura en la nube (Floci / AWS).

### Flujo de Datos y Pipeline de Ejecución

```text
[Cliente React] ──► [FastAPI Controller] ──► [1° Amazon Textract (OCR)]
                           │                               │
                           │ Binario JPG/PNG               │ Payload JSON
                           ▼                               ▼
                 [2° Amazon S3 (Bucket)]  ──► [3° Amazon DynamoDB (Tabla)]
                                                   │
                                                   └── (Rollback en S3 si falla DynamoDB)
```

1. **Captura y Envío:** El cliente React envía los datos del formulario y la imagen del comprobante vía `multipart/form-data` al endpoint `POST /comprobantes`.
2. **1° Extracción OCR con Textract:** El backend procesa prioritariamente los bytes de la imagen y extrae el payload JSON estructurado con los datos fiscales (RUC, serie-número, fecha, montos e ítems).
3. **2° Almacenamiento en S3:** Se genera una clave UUID estructurada (`comprobantes/{id}.jpg`) y se almacena el archivo binario original en el bucket `comprobantes-bucket`.
4. **3° Persistencia NoSQL en DynamoDB:** Se guarda el registro completo en la tabla `comprobantes`. Si ocurre una falla en la base de datos, se activa el mecanismo de rollback que purga inmediatamente el objeto en S3 para evitar archivos huérfanos.

---

## Servicios AWS Implementados

| Servicio AWS | Recurso / Componente | Propósito en el Proyecto |
| :--- | :--- | :--- |
| **Amazon S3** | Bucket `comprobantes-bucket` | Almacenamiento persistente de los archivos originales (JPG/PNG) con claves estructuradas (`comprobantes/{uuid}.{ext}`). Soporta streaming de descarga y eliminación física. |
| **Amazon Textract** | `textract_service.py` | Motor OCR que analiza los bytes de la imagen y normaliza un payload JSON con emisor, RUC, serie-número, fecha, sede, subtotal, IGV (18%) e ítems detallados. |
| **Amazon DynamoDB** | Tabla `comprobantes` (PK: `id`) | Base de datos NoSQL de alta velocidad. Persiste los metadatos del formulario, el enlace al objeto en S3 y el JSON serializado de Textract. |

---

## Stack Tecnológico

* **Cloud & Emulación:** Docker, Floci (`http://localhost:4566`, región `us-east-1`), compatible con AWS Cloud.
* **Backend:** Python 3, FastAPI, Uvicorn, Boto3 (SDK oficial AWS), Pydantic, Python-Multipart.
* **Frontend:** React 19, TypeScript, Vite, Lucide Icons.
* **Estilos:** CSS3 modular con variables personalizadas inspiradas en la paleta oficial de AWS (Obsidian Slate `#0F172A` y Smile Orange `#FF9900`).

---

## Estructura del Proyecto

```text
app-aws/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── dynamo_service.py     # Operaciones CRUD y serialización DynamoDB
│   │   │   ├── s3_service.py         # Subida, streaming y purga en S3
│   │   │   └── textract_service.py   # Extracción OCR y normalización JSON
│   │   ├── __init__.py
│   │   ├── config.py                 # Conexión Boto3 (Modo dual Floci / AWS Real)
│   │   ├── init_aws.py               # Bootstrap automatizado de S3 y DynamoDB
│   │   └── main.py                   # API REST FastAPI, CORS y rutas
│   ├── requirements.txt              # Dependencias de Python
│   ├── .env.example                  # Plantilla de variables de entorno
│   └── .env                          # Variables de configuración local
├── ui/
│   ├── src/
│   │   ├── api/
│   │   │   └── comprobantes.ts       # Capa de consumo HTTP Fetch
│   │   ├── components/
│   │   │   ├── ComprobanteForm.tsx   # Formulario reactivo con validaciones
│   │   │   ├── ComprobanteTable.tsx  # Tabla dinámica con 3 acciones por fila
│   │   │   ├── ImageModal.tsx        # Modal visor de imagen transmitida desde S3
│   │   │   ├── JsonModal.tsx         # Modal visor estructurado del JSON OCR
│   │   │   └── DeleteConfirmModal.tsx# Modal de confirmación de eliminación
│   │   ├── types/
│   │   │   └── comprobante.ts        # Interfaces y tipos de TypeScript
│   │   ├── App.tsx                   # Layout principal Single-Page y estado
│   │   ├── App.css                   # Sistema de diseño y temas AWS
│   │   └── main.tsx                  # Punto de entrada de React
│   ├── package.json                  # Dependencias frontend
│   └── vite.config.ts                # Configuración de compilación Vite
└── README.md                         # Documentación principal del repositorio
```

---

## Requisitos Previos

Antes de comenzar, asegúrate de contar con las siguientes herramientas instaladas:

* **Docker Desktop** (en ejecución).
* **Python 3.10+** (recomendado Python 3.11, 3.12 o 3.14).
* **Node.js 18+** y **npm**.
* **Git**.

---

## Guía de Instalación y Ejecución

Para iniciar el sistema completo en tu máquina local, abre **tres terminales** independientes:

### Terminal 1: Emulador AWS Floci (Docker)

Descarga e inicia el contenedor de Floci exponiendo el puerto `4566`:

```bash
docker run -d -p 4566:4566 --name floci floci/floci:latest
```

> **Verificación:** Puedes comprobar que Floci responde visitando `http://localhost:4566` en tu navegador.

---

### Terminal 2: Backend FastAPI (Python)

1. Ingresa a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Crea y activa un entorno virtual de Python:
   ```bash
   # En Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # En Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Asegúrate de tener tu archivo `.env` configurado (puedes copiarlo desde `.env.example`):
   ```bash
   cp .env.example .env
   ```

5. Inicializa los recursos de AWS (crea el bucket S3 y la tabla DynamoDB automáticamente):
   ```bash
   python -m app.init_aws
   ```

6. Inicia el servidor FastAPI con recarga automática:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

> **Verificación:** La API estará disponible en `http://localhost:8000` y la documentación interactiva en `http://localhost:8000/docs`.

---

### Terminal 3: Frontend React + Vite

1. Ingresa a la carpeta `ui`:
   ```bash
   cd ui
   ```

2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

> **Acceso Web:** Abre tu navegador e ingresa a **`http://localhost:5173`**.

---

## Especificación de la API REST

| Método | Ruta / Endpoint | Parámetros / Entrada | Descripción | Código de Respuesta |
| :--- | :--- | :--- | :--- | :--- |
| **`POST`** | `/comprobantes` | `multipart/form-data` | Valida archivo (.jpg, .jpeg, .png). Ejecuta Textract OCR -> Sube a S3 -> Inserta en DynamoDB. Si falla DynamoDB, aplica rollback en S3. | `201 Created` |
| **`GET`** | `/comprobantes` | Ninguno | Escanea la tabla DynamoDB con `scan()`, deserializa el JSON de Textract y retorna los comprobantes ordenados cronológicamente descendente. | `200 OK` |
| **`GET`** | `/comprobantes/{id}/imagen` | `id` (UUID en path) | Obtiene la clave `s3_key` desde DynamoDB y descarga los bytes desde S3 mediante streaming con su `Content-Type` nativo. | `200 OK` |
| **`DELETE`** | `/comprobantes/{id}` | `id` (UUID en path) | Ejecuta la eliminación física sincronizada del archivo en Amazon S3 (`delete_object`) y del registro en Amazon DynamoDB (`delete_item`). | `200 OK` |

---

## Configuración de Variables de Entorno

El archivo `backend/.env` permite cambiar el comportamiento entre local y nube sin modificar código:

### Opción 1: Modo Local con Floci (Por Defecto)
```ini
AWS_ENDPOINT_URL=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=comprobantes-bucket
DYNAMO_TABLE=Comprobantes
```

### Opción 2: Modo AWS Real (Producción / Nube)
Para conectar a la nube real de Amazon Web Services:
```ini
# Dejar vacío o comentar AWS_ENDPOINT_URL para apuntar a AWS Real
# AWS_ENDPOINT_URL=

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Si usas credenciales temporales de AWS Academy, Learner Lab o SSO:
# AWS_SESSION_TOKEN=AQoDYXdzEJr1...

# Nombre único global para tu bucket S3:
S3_BUCKET=comprobantes-empresa-2026-unique
DYNAMO_TABLE=Comprobantes
```

---

## Interfaz de Usuario (Single-Page Dashboard)

La interfaz fue diseñada con altos estándares de usabilidad (UX) y armonía visual basada en la identidad oficial de AWS:

1. **Header Temático AWS:** Muestra el pipeline interactivo de arquitectura (`Amazon S3 -> Amazon Textract -> Amazon DynamoDB`).
2. **Formulario Superior:**
   - Selector segmentado para alternar entre **Boleta** y **Factura**.
   - Selector de sedes comerciales mediante botones limpios (**Chincha**, **Pisco**, **Ica**).
   - Dropzone interactiva con vista previa y simulación de escáner láser al cargar imágenes.
   - Stepper en tiempo real que ilustra las fases del pipeline serverless durante el guardado.
3. **Tabla Inferior con 3 Acciones por Registro:**
   - **Vista Previa:** Abre el modal `ImageModal` recuperando la imagen en streaming directo desde Amazon S3.
   - **Ver JSON:** Despliega el modal `JsonModal` con el árbol de datos estructurados devuelto por Textract y opción de copiado al portapapeles.
   - **Eliminar:** Modal de confirmación que purga de forma sincronizada el archivo en S3 y el ítem en DynamoDB.
4. **Footer Acomodado:** Pie de página estructurado en dos columnas con identificación tecnológica e indicadores de estado de los servicios.
