export type TipoComprobante = 'Boleta' | 'Factura';
export type Tienda = 'Chincha' | 'Pisco' | 'Ica';

export interface Comprobante {
  id: string;
  tipo_comprobante: TipoComprobante;
  fecha_emision: string;
  usuario: string;
  tienda: Tienda;
  observacion?: string;
  s3_key: string;
  content_type: string;
  textract_data: Record<string, unknown>;
  created_at: string;
}
