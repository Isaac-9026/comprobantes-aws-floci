import React, { useState, useRef } from 'react';
import type { TipoComprobante, Tienda } from '../types/comprobante';
import { crearComprobante } from '../api/comprobantes';
import {
  UploadCloud,
  FileText,
  Calendar,
  User,
  Store,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';

interface ComprobanteFormProps {
  onCreated: () => void;
  onError?: (mensaje: string) => void;
  onSuccess?: (mensaje: string) => void;
}

export const ComprobanteForm: React.FC<ComprobanteFormProps> = ({
  onCreated,
  onError,
  onSuccess,
}) => {
  // Campos del formulario
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobante>('Factura');
  const [fechaEmision, setFechaEmision] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [usuario, setUsuario] = useState<string>('');
  const [tienda, setTienda] = useState<Tienda>('Chincha');
  const [observacion, setObservacion] = useState<string>('');
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados visuales de interacción
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const procesarArchivo = (file: File) => {
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      if (onError) onError('Formato inválido. Solo se admiten imágenes JPG o PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (onError) onError('El archivo supera el límite de 5 MB.');
      return;
    }
    setArchivoSeleccionado(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      procesarArchivo(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      procesarArchivo(e.dataTransfer.files[0]);
    }
  };

  const resetearArchivo = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setArchivoSeleccionado(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivoSeleccionado) {
      if (onError) onError('Debes adjuntar la imagen del comprobante antes de procesar.');
      return;
    }

    if (!usuario.trim()) {
      if (onError) onError('Por favor ingresa el nombre de la persona que sube el archivo.');
      return;
    }

    setCargando(true);
    setPipelineStep(1);

    // Animación simulada de los 3 pasos de AWS mientras la petición se procesa
    const stepInterval = setInterval(() => {
      setPipelineStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 600);

    try {
      const formData = new FormData();
      formData.append('tipo_comprobante', tipoComprobante);
      formData.append('fecha_emision', fechaEmision);
      formData.append('usuario', usuario.trim());
      formData.append('tienda', tienda);
      formData.append('observacion', observacion.trim());
      formData.append('imagen', archivoSeleccionado);

      await crearComprobante(formData);

      if (onSuccess) {
        onSuccess(
          `¡${tipoComprobante} registrada exitosamente! Procesada con Textract, S3 y DynamoDB.`
        );
      }

      // Limpiar formulario
      setUsuario('');
      setObservacion('');
      setTipoComprobante('Factura');
      setTienda('Chincha');
      setFechaEmision(new Date().toISOString().split('T')[0]);
      resetearArchivo();

      // Recargar la tabla
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el comprobante';
      if (onError) onError(msg);
    } finally {
      clearInterval(stepInterval);
      setCargando(false);
      setPipelineStep(1);
    }
  };

  return (
    <div className="card bento-card">
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-icon-badge bg-primary-gradient text-white">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="card-title">Automatizar Nuevo Comprobante</h2>
            <p className="card-subtitle">
              Sube el comprobante físico o digital para extracción y persistencia automática en AWS
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="split-form-grid">
        <div className="form-column-left">
          {/* Segmented Control para Boleta / Factura */}
          <div className="form-group">
            <label className="form-label">
              <FileText size={15} /> Tipo de Comprobante *
            </label>
            <div className="segmented-control">
              <button
                type="button"
                className={`segmented-btn ${tipoComprobante === 'Factura' ? 'segmented-active-factura' : ''
                  }`}
                onClick={() => setTipoComprobante('Factura')}
                disabled={cargando}
              >
                Factura
              </button>
              <button
                type="button"
                className={`segmented-btn ${tipoComprobante === 'Boleta' ? 'segmented-active-boleta' : ''
                  }`}
                onClick={() => setTipoComprobante('Boleta')}
                disabled={cargando}
              >
                Boleta
              </button>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="fecha_emision">
                <Calendar size={15} /> Fecha de Emisión *
              </label>
              <input
                id="fecha_emision"
                type="date"
                className="form-control"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                disabled={cargando}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="usuario">
                <User size={15} /> Subido Por *
              </label>
              <input
                id="usuario"
                type="text"
                className="form-control"
                placeholder="Ej. Isaac Paucar"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={cargando}
                required
              />
            </div>
          </div>

          {/* Tienda en Chips / Pills */}
          <div className="form-group">
            <label className="form-label">
              <Store size={15} /> Tienda Destino *
            </label>
            <div className="store-chips-group">
              {(['Chincha', 'Pisco', 'Ica'] as Tienda[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`store-chip store-chip-${t.toLowerCase()} ${tienda === t ? 'store-chip-selected' : ''
                    }`}
                  onClick={() => setTienda(t)}
                  disabled={cargando}
                >
                  <span className="store-chip-dot"></span>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Observación Opcional */}
          <div className="form-group">
            <label className="form-label" htmlFor="observacion">
              <MessageSquare size={15} /> Observaciones (Opcional)
            </label>
            <textarea
              id="observacion"
              className="form-control"
              rows={2}
              placeholder="Notas de auditoría, proveedor o detalle de compra..."
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={cargando}
            />
          </div>

          {/* Botón de Enviar */}
          <div className="form-submit-wrapper">
            <button
              type="submit"
              className="btn btn-primary btn-submit-innovative"
              disabled={cargando || !archivoSeleccionado}
            >
              {cargando ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Procesando Pipeline AWS...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Procesar y Guardar Comprobante</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="form-column-right">
          {cargando ? (
            /* PIPELINE ANIMADO DE LOS 3 SERVICIOS DE AWS */
            <div className="aws-pipeline-card">
              <h4 className="pipeline-title">
                <Sparkles size={18} className="text-primary inline mr-2" />
                Pipeline Serverless en Ejecución
              </h4>
              <p className="pipeline-subtitle">
                Interactuando en vivo con los servicios emulados en Floci
              </p>

              <div className="pipeline-steps-list">
                {/* Paso 1: Textract */}
                <div
                  className={`pipeline-step-item ${pipelineStep >= 1 ? 'pipeline-active' : ''
                    }`}
                >
                  <div className="pipeline-step-icon bg-purple-light text-purple">
                    <Cpu size={18} />
                  </div>
                  <div className="pipeline-step-content">
                    <div className="pipeline-step-header">
                      <strong>Amazon Textract</strong>
                      {pipelineStep > 1 && (
                        <CheckCircle2 size={16} className="text-emerald" />
                      )}
                    </div>
                    <span className="pipeline-step-desc">
                      {pipelineStep === 1
                        ? 'Analizando documento OCR y extrayendo JSON...'
                        : 'Datos fiscales y totales extraídos con éxito'}
                    </span>
                  </div>
                </div>

                {/* Paso 2: S3 */}
                <div
                  className={`pipeline-step-item ${pipelineStep >= 2 ? 'pipeline-active' : 'pipeline-pending'
                    }`}
                >
                  <div className="pipeline-step-icon bg-blue-light text-blue">
                    <Layers size={18} />
                  </div>
                  <div className="pipeline-step-content">
                    <div className="pipeline-step-header">
                      <strong>Amazon S3</strong>
                      {pipelineStep > 2 && (
                        <CheckCircle2 size={16} className="text-emerald" />
                      )}
                    </div>
                    <span className="pipeline-step-desc">
                      {pipelineStep === 2
                        ? 'Almacenando archivo original en el bucket...'
                        : pipelineStep > 2
                          ? 'Imagen persistida con cifrado en S3'
                          : 'En cola...'}
                    </span>
                  </div>
                </div>

                {/* Paso 3: DynamoDB */}
                <div
                  className={`pipeline-step-item ${pipelineStep >= 3 ? 'pipeline-active' : 'pipeline-pending'
                    }`}
                >
                  <div className="pipeline-step-icon bg-emerald-light text-emerald">
                    <Database size={18} />
                  </div>
                  <div className="pipeline-step-content">
                    <div className="pipeline-step-header">
                      <strong>Amazon DynamoDB</strong>
                      {pipelineStep >= 3 && (
                        <CheckCircle2 size={16} className="text-emerald" />
                      )}
                    </div>
                    <span className="pipeline-step-desc">
                      {pipelineStep >= 3
                        ? 'Indexando registro y persistiendo JSON...'
                        : 'En cola...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : previewUrl ? (
            /* VISTA PREVIA INSTANTÁNEA CON EFECTO LÁSER */
            <div className="dropzone-preview-container">
              <div className="scanner-preview-wrapper">
                <img
                  src={previewUrl}
                  alt="Vista previa del comprobante"
                  className="scanner-preview-image"
                />
                <div className="laser-scanner-line"></div>
              </div>

              <div className="preview-meta-card">
                <div className="preview-meta-info">
                  <span className="file-name font-semibold text-truncate">
                    {archivoSeleccionado?.name}
                  </span>
                  <span className="file-badge-size text-muted">
                    {archivoSeleccionado && (archivoSeleccionado.size / 1024).toFixed(1)} KB •{' '}
                    {archivoSeleccionado?.type === 'image/png' ? 'PNG' : 'JPG'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetearArchivo}
                  className="btn btn-sm btn-outline text-danger"
                  title="Eliminar y seleccionar otra imagen"
                >
                  Cambiar
                </button>
              </div>
            </div>
          ) : (
            /* ÁREA DROPZONE INTERACTIVA VACÍA */
            <div
              className={`dropzone-interactive ${isDragging ? 'dropzone-dragging' : ''
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="hidden-file-input"
              />
              <div className="dropzone-icon-circle">
                <UploadCloud size={32} className="text-primary" />
              </div>
              <h3 className="dropzone-title">Arrastra y suelta tu comprobante aquí</h3>
              <p className="dropzone-desc">
                o <span className="text-primary font-semibold underline">explora tus archivos</span>
              </p>
              <div className="dropzone-footer-pill">
                <span>Formatos soportados: JPG, PNG • Máximo 5MB</span>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
