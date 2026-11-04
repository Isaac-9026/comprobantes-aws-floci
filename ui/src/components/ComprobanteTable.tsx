import React, { useState, useMemo } from 'react';
import type { Comprobante, TipoComprobante, Tienda } from '../types/comprobante';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Eye, Code2, Trash2, Search, X, Receipt, Inbox } from 'lucide-react';

interface ComprobanteTableProps {
  comprobantes: Comprobante[];
  onPreviewImage: (c: Comprobante) => void;
  onViewJson: (c: Comprobante) => void;
  onDelete: (id: string) => void;
  cargando?: boolean;
}

export const ComprobanteTable: React.FC<ComprobanteTableProps> = ({
  comprobantes,
  onPreviewImage,
  onViewJson,
  onDelete,
  cargando = false,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | TipoComprobante>('Todos');
  const [filtroTienda, setFiltroTienda] = useState<'Todas' | Tienda>('Todas');

  // Modal de confirmación de eliminación
  const [comprobanteToDelete, setComprobanteToDelete] = useState<Comprobante | null>(null);

  // Filtrado reactivo en tiempo real
  const comprobantesFiltrados = useMemo(() => {
    return comprobantes.filter((c) => {
      const matchTipo = filtroTipo === 'Todos' || c.tipo_comprobante === filtroTipo;
      const matchTienda = filtroTienda === 'Todas' || c.tienda === filtroTienda;
      const matchSearch =
        searchTerm.trim() === '' ||
        c.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tienda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.observacion && c.observacion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        c.fecha_emision.includes(searchTerm);

      return matchTipo && matchTienda && matchSearch;
    });
  }, [comprobantes, filtroTipo, filtroTienda, searchTerm]);

  return (
    <div className="card bento-card">
      {/* Header de la Tabla */}
      <div className="card-header table-card-header">
        <div className="card-title-group">
          <div className="card-icon-badge bg-primary-light text-primary">
            <Receipt size={22} />
          </div>
          <div>
            <h2 className="card-title">Comprobantes Registrados</h2>
            <p className="card-subtitle">
              Persistidos en DynamoDB con archivos originales protegidos en Amazon S3
            </p>
          </div>
        </div>
        <div className="badge-counter">
          Total: <strong>{comprobantesFiltrados.length}</strong> {comprobantesFiltrados.length === 1 ? 'registro' : 'registros'}
        </div>
      </div>

      {/* Barra de Control Limpia */}
      <div className="table-controls-clean">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por usuario, tienda o fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="search-clear-btn"
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="clean-filter-group">
          <select
            className="clean-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as 'Todos' | TipoComprobante)}
          >
            <option value="Todos">Todos los tipos</option>
            <option value="Factura">Solo Facturas</option>
            <option value="Boleta">Solo Boletas</option>
          </select>

          <select
            className="clean-select"
            value={filtroTienda}
            onChange={(e) => setFiltroTienda(e.target.value as 'Todas' | Tienda)}
          >
            <option value="Todas">Todas las tiendas</option>
            <option value="Chincha">Chincha</option>
            <option value="Pisco">Pisco</option>
            <option value="Ica">Ica</option>
          </select>
        </div>
      </div>

      {/* Data Grid / Tabla */}
      {cargando ? (
        <div className="table-loading-state">
          <div className="spinner"></div>
          <p>Consultando Amazon DynamoDB en tiempo real...</p>
        </div>
      ) : comprobantesFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-box">
            <Inbox size={40} className="text-muted" />
          </div>
          <h3 className="empty-title">
            {searchTerm || filtroTipo !== 'Todos' || filtroTienda !== 'Todas'
              ? 'No se encontraron comprobantes'
              : 'Aún no hay comprobantes registrados'}
          </h3>
          <p className="empty-desc">
            {searchTerm || filtroTipo !== 'Todos' || filtroTienda !== 'Todas'
              ? 'Prueba modificando el término de búsqueda o restableciendo los filtros.'
              : 'Usa el formulario superior para registrar y procesar tu primer comprobante.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha Emisión</th>
                <th>Usuario</th>
                <th>Tienda</th>
                <th>Observación</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comprobantesFiltrados.map((c) => (
                <tr key={c.id} className="table-row">
                  {/* Tipo Limpio */}
                  <td>
                    <span className="tipo-documento">
                      {c.tipo_comprobante}
                    </span>
                  </td>

                  {/* Fecha de Emisión */}
                  <td className="font-mono text-nowrap text-slate">{c.fecha_emision}</td>

                  {/* Usuario Limpio */}
                  <td>
                    <span className="user-name">{c.usuario}</span>
                  </td>

                  {/* Tienda */}
                  <td>
                    <span className={`store-badge-tag store-tag-${c.tienda.toLowerCase()}`}>
                      {c.tienda}
                    </span>
                  </td>

                  {/* Observación */}
                  <td className="text-observation">
                    {c.observacion ? (
                      <span title={c.observacion}>{c.observacion}</span>
                    ) : (
                      <span className="text-muted italic">Sin observaciones</span>
                    )}
                  </td>

                  {/* 3 Acciones Requeridas: (1) Eliminar, (2) Vista Previa, (3) Ver JSON */}
                  <td className="text-center">
                    <div className="action-buttons-group">
                      {/* 1. Vista Previa de Imagen */}
                      <button
                        onClick={() => onPreviewImage(c)}
                        className="btn-action btn-action-preview"
                        title="Ver imagen original en Amazon S3"
                      >
                        <Eye size={15} />
                        <span>Vista previa</span>
                      </button>

                      {/* 2. Visualizar JSON de Textract */}
                      <button
                        onClick={() => onViewJson(c)}
                        className="btn-action btn-action-json"
                        title="Ver JSON estructurado de Textract"
                      >
                        <Code2 size={15} />
                        <span>Ver JSON</span>
                      </button>

                      {/* 3. Eliminar Comprobante */}
                      <button
                        onClick={() => setComprobanteToDelete(c)}
                        className="btn-action btn-action-delete"
                        title="Eliminar de S3 y DynamoDB"
                      >
                        <Trash2 size={15} />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={Boolean(comprobanteToDelete)}
        tipoComprobante={comprobanteToDelete?.tipo_comprobante}
        usuario={comprobanteToDelete?.usuario}
        onClose={() => setComprobanteToDelete(null)}
        onConfirm={() => {
          if (comprobanteToDelete) {
            onDelete(comprobanteToDelete.id);
          }
        }}
      />
    </div>
  );
};
