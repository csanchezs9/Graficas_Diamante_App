import { Maquina } from "../types/maquina";

const API_URL = "http://localhost:3000/api";

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

  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("image", {
      uri,
      name: filename,
      type,
    } as unknown as Blob);

    const res = await fetch(`${API_URL}/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Error al subir imagen");
    const json = await res.json();
    return json.url;
  },
};
