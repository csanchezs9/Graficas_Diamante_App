import { Maquina } from "../types/maquina";
import { Mantenimiento } from "../types/mantenimiento";

const API_URL = "http://192.168.1.2:3000/api";

export const api = {
  // Máquinas
  async getMaquinas(): Promise<Maquina[]> {
    const res = await fetch(`${API_URL}/maquinas`);
    if (!res.ok) throw new Error("Error al obtener máquinas");
    return res.json();
  },

  async createMaquina(data: Omit<Maquina, "id" | "created_at">): Promise<Maquina> {
    const res = await fetch(`${API_URL}/maquinas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear máquina");
    return res.json();
  },

  async deleteMaquina(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/maquinas/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar máquina");
  },

  async updateMaquina(id: string, data: Omit<Maquina, "id" | "created_at">): Promise<Maquina> {
    const res = await fetch(`${API_URL}/maquinas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar máquina");
    return res.json();
  },

  async uploadImage(uri: string, bucket: string = "maquinas"): Promise<string> {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("image", {
      uri,
      name: filename,
      type,
    } as unknown as Blob);

    const res = await fetch(`${API_URL}/upload?bucket=${bucket}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Error al subir imagen");
    const json = await res.json();
    return json.url;
  },

  // Mantenimientos
  async getMantenimientos(maquina_id?: string): Promise<Mantenimiento[]> {
    const url = maquina_id
      ? `${API_URL}/mantenimientos?maquina_id=${maquina_id}`
      : `${API_URL}/mantenimientos`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Error al obtener mantenimientos");
    return res.json();
  },

  async createMantenimiento(data: Omit<Mantenimiento, "id" | "created_at" | "maquinas">): Promise<Mantenimiento> {
    const res = await fetch(`${API_URL}/mantenimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear mantenimiento");
    return res.json();
  },

  async deleteMantenimiento(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/mantenimientos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Error al eliminar mantenimiento");
  },

  async updateMantenimiento(id: string, data: Partial<Mantenimiento>): Promise<Mantenimiento> {
    const res = await fetch(`${API_URL}/mantenimientos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar mantenimiento");
    return res.json();
  },
};
