export interface Maquina {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  ubicacion: string;
  imagen_url: string | null;
  estado: string;
  fecha_ultima_inspeccion: string | null;
  created_at: string;
}
