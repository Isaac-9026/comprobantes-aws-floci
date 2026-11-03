import React, { useEffect } from 'react';
import type { Comprobante } from '../types/comprobante';
import { obtenerUrlImagen } from '../api/comprobantes';
import { X, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  comprobante: Comprobante | null;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ comprobante, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!comprobante) return null;

  const imageUrl = obtenerUrlImagen(comprobante.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-image"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-blue-light">
              <ImageIcon size={20} className="text-blue" />
            </div>
            <div>
              <h3 className="modal-title">Vista Previa del Comprobante</h3>
              <p className="modal-subtitle">
                {comprobante.tipo_comprobante} • Tienda {comprobante.tienda} • {comprobante.fecha_emision}
              </p>
            </div>
          </div>
          <div className="modal-actions">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-icon"
              title="Abrir imagen en nueva pestaña"
            >
              <ExternalLink size={18} />
            </a>
            <button onClick={onClose} className="btn-icon" title="Cerrar modal">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body-image">
          <img
            src={imageUrl}
            alt={`Comprobante ${comprobante.tipo_comprobante} - ${comprobante.id}`}
            className="comprobante-preview-img"
          />
        </div>

        <div className="modal-footer">
          <span className="text-muted text-xs font-mono">
            Key S3: {comprobante.s3_key}
          </span>
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

