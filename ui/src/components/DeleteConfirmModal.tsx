import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tipoComprobante?: string;
  usuario?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tipoComprobante = 'comprobante',
  usuario = '',
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header modal-header-danger">
          <div className="modal-title-group">
            <div className="modal-icon-badge bg-danger-light text-danger">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="modal-title text-danger">Eliminar Comprobante</h3>
              <p className="modal-subtitle">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body-confirm">
          <p>
            ¿Estás seguro de que deseas eliminar permanentemente esta{' '}
            <strong>{tipoComprobante}</strong> {usuario ? `subida por ${usuario}` : ''}?
          </p>
          <div className="confirm-impact-box">
            <span>• Se eliminará la imagen del bucket en <strong>Amazon S3</strong></span>
            <span>• Se borrará el registro indexado en <strong>Amazon DynamoDB</strong></span>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn btn-danger"
          >
            <Trash2 size={16} />
            <span>Sí, Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

