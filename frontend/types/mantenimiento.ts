export interface Mantenimiento {
  id: string;
  maquina_id: string;
  fecha_realizacion: string;
  tecnico_responsable: string;
  descripcion: string;
  fotos_urls: string[];
  costo_total: number;
  tipo: string; // "correctivo" | "preventivo"
  created_at: string;
  maquinas?: { nombre: string };
}
