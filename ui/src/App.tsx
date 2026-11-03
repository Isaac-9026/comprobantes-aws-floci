import { useState, useEffect, useCallback } from 'react';
import type { Comprobante } from './types/comprobante';
import { listarComprobantes, eliminarComprobante } from './api/comprobantes';
import { ComprobanteForm } from './components/ComprobanteForm';
import { ComprobanteTable } from './components/ComprobanteTable';
import { ImageModal } from './components/ImageModal';
import { JsonModal } from './components/JsonModal';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Cloud,
  Cpu,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';
import './App.css';

interface AlertState {
  tipo: 'success' | 'error';
  mensaje: string;
}

export function App() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [alert, setAlert] = useState<AlertState | null>(null);

  // Estados para modales
  const [modalImageComprobante, setModalImageComprobante] = useState<Comprobante | null>(null);
  const [modalJsonComprobante, setModalJsonComprobante] = useState<Comprobante | null>(null);

  const cargarComprobantes = useCallback(async () => {
    try {
      setCargando(true);
      const data = await listarComprobantes();
      setComprobantes(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el backend de FastAPI. Verifica que uvicorn esté corriendo en el puerto 8000.';
      setAlert({ tipo: 'error', mensaje: msg });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarComprobantes();
  }, [cargarComprobantes]);

  const mostrarExito = (mensaje: string) => {
    setAlert({ tipo: 'success', mensaje });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setAlert((curr) => (curr?.mensaje === mensaje ? null : curr));
    }, 5000);
  };

  const mostrarError = (mensaje: string) => {
    setAlert({ tipo: 'error', mensaje });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await eliminarComprobante(id);
      mostrarExito('Comprobante eliminado con éxito de DynamoDB y S3.');
      setComprobantes((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar comprobante';
      mostrarError(msg);
    }
  };

  return (
    <div className="app-layout">
      {/* 1. HEADER: Branding AWS + Pipeline de Arquitectura Cloud */}
      <header className="app-header">
        <div className="header-container">
          <div className="brand-group">
            <div className="brand-icon">
              <Cloud size={26} className="text-white" />
            </div>
            <div>
              <div className="brand-badge-top">AWS ARCHITECTURE • FLOCI</div>
              <h1 className="brand-title">App Automatizar gestión de comprobantes</h1>
              <p className="brand-subtitle">
                Extracción OCR con <span className="aws-highlight">Amazon Textract</span>, almacenamiento en{' '}
                <span className="aws-highlight">Amazon S3</span> y persistencia en{' '}
                <span className="aws-highlight">Amazon DynamoDB</span>
              </p>
            </div>
          </div>

          {/* Pipeline de Servicios AWS */}
          <div className="aws-pipeline-flow">
            <div className="aws-node" title="Amazon S3: Almacenamiento seguro de comprobantes">
              <div className="aws-node-icon">
                <Layers size={14} />
              </div>
              <div className="aws-node-text">
                <span className="aws-node-title">Amazon S3</span>
                <span className="aws-node-sub">Bucket Storage</span>
              </div>
            </div>

            <div className="aws-flow-divider" aria-hidden="true">
              <ArrowRight size={13} />
            </div>

            <div className="aws-node" title="Amazon Textract: Extracción OCR de datos">
              <div className="aws-node-icon">
                <Cpu size={14} />
              </div>
              <div className="aws-node-text">
                <span className="aws-node-title">Amazon Textract</span>
                <span className="aws-node-sub">OCR Inteligente</span>
              </div>
            </div>

            <div className="aws-flow-divider" aria-hidden="true">
              <ArrowRight size={13} />
            </div>

            <div className="aws-node" title="Amazon DynamoDB: Persistencia NoSQL estructurada">
              <div className="aws-node-icon">
                <Database size={14} />
              </div>
              <div className="aws-node-text">
                <span className="aws-node-title">Amazon DynamoDB</span>
                <span className="aws-node-sub">Tabla NoSQL</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="main-container">
        {/* Banner de Alertas */}
        {alert && (
          <div
            className={`alert-banner ${
              alert.tipo === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            <div className="alert-content">
              {alert.tipo === 'success' ? (
                <CheckCircle2 size={20} className="alert-icon" />
              ) : (
                <AlertCircle size={20} className="alert-icon" />
              )}
              <span>{alert.mensaje}</span>
            </div>
            <button
              onClick={() => setAlert(null)}
              className="alert-close-btn"
              title="Cerrar notificación"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* 1. SECCIÓN SUPERIOR: Formulario de Registro */}
        <section className="section-form">
          <ComprobanteForm
            onCreated={cargarComprobantes}
            onSuccess={mostrarExito}
            onError={mostrarError}
          />
        </section>

        {/* 2. SECCIÓN INFERIOR: Tabla de Comprobantes con 3 Acciones */}
        <section className="section-table">
          <ComprobanteTable
            comprobantes={comprobantes}
            cargando={cargando}
            onPreviewImage={(c) => setModalImageComprobante(c)}
            onViewJson={(c) => setModalJsonComprobante(c)}
            onDelete={handleDelete}
          />
        </section>
      </main>

      {/* MODALES SUPERPUESTOS */}
      {modalImageComprobante && (
        <ImageModal
          comprobante={modalImageComprobante}
          onClose={() => setModalImageComprobante(null)}
        />
      )}

      {modalJsonComprobante && (
        <JsonModal
          comprobante={modalJsonComprobante}
          onClose={() => setModalJsonComprobante(null)}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <p>
            <strong>App Automatizar gestión de comprobantes</strong> • FastAPI + boto3 y React +
            TypeScript
          </p>
          <p className="text-muted text-xs">
            Servicios AWS emulados con Floci en <code>http://localhost:4566</code>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
