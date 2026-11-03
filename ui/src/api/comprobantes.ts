import type { Comprobante } from '../types/comprobante';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function extraerError(response: Response, fallback: string): Promise<Error> {
  try {
    const data = await response.json();
    const mensaje = typeof data.detail === 'string' 
      ? data.detail 
      : (Array.isArray(data.detail) ? data.detail.map((d: { msg?: string }) => d.msg || '').join(', ') : fallback);
    return new Error(mensaje || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function listarComprobantes(): Promise<Comprobante[]> {
  const response = await fetch(`${API_URL}/comprobantes`);
  if (!response.ok) {
    throw await extraerError(response, 'Error al obtener la lista de comprobantes');
  }
  return response.json();
}

export async function crearComprobante(formData: FormData): Promise<Comprobante> {
  const response = await fetch(`${API_URL}/comprobantes`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw await extraerError(response,'Error al registrar el comprobante');
  }
  return response.json();
}

export async function eliminarComprobante(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/comprobantes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw await extraerError(response, 'Error al eliminar el comprobante');
  }
}

export function obtenerUrlImagen(id: string): string {
  return `${API_URL}/comprobantes/${id}/imagen`;
}
