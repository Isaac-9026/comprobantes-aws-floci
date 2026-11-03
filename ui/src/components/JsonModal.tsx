import React, { useState, useEffect } from 'react';
import type { Comprobante } from '../types/comprobante';
import { X, Code2, Copy, Check } from 'lucide-react';

interface JsonModalProps {
  comprobante: Comprobante | null;
  onClose: () => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({ comprobante, onClose }) => {
  const [copiado, setCopiado] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!comprobante) return null;

  const jsonString = JSON.stringify(comprobante.textract_data, null, 2);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-json"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-emerald-light text-emerald">
              <Code2 size={20} />
            </div>
            <div>
              <h3 className="modal-title">Resultado OCR Textract (JSON)</h3>
              <p className="modal-subtitle">
                ID: <span className="font-mono text-xs">{comprobante.id}</span> • {comprobante.tipo_comprobante}
              </p>
            </div>
          </div>

          <div className="modal-actions">
            <button
              onClick={handleCopiar}
              className={`btn btn-sm ${copiado ? 'btn-success' : 'btn-outline'}`}
              title="Copiar JSON al portapapeles"
            >
              {copiado ? (
                <>
                  <Check size={14} /> Copiado
                </>
              ) : (
                <>
                  <Copy size={14} /> Copiar JSON
                </>
              )}
            </button>
            <button onClick={onClose} className="btn-icon" title="Cerrar modal">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body-json">
          <pre className="json-code-block">{jsonString}</pre>
        </div>

        <div className="modal-footer">
          <span className="text-muted text-xs font-mono">
            S3 Key: {comprobante.s3_key}
          </span>
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
