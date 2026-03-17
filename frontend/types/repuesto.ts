export interface Repuesto {
  id: string;
  mantenimiento_id: string;
  nombre: string;
  tipo: string;
  cantidad_disponible: number;
  costo_unitario: number;
  proveedor: string;
  fecha: string;
  imagen_url: string | null;
  created_at: string;
  mantenimientos?: {
    descripcion: string;
    maquina_id: string;
    maquinas: { nombre: string };
  };
}
