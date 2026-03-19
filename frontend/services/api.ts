import { Maquina } from "../types/maquina";
import { Mantenimiento } from "../types/mantenimiento";
import { Repuesto } from "../types/repuesto";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

const TIMEOUT_MS = 60000;       // 60s to handle Render cold starts (~30-40s)
const TIMEOUT_MS_WRITE = 30000; // 30s for POST/PUT/DELETE

function fetchWithTimeout(url: string, options?: RequestInit, timeout = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { ...options, signal: controller.signal })
    .catch((err) => {
      if (err.name === "AbortError") {
        throw new Error("Tiempo de espera agotado. Revisa tu conexión e intenta de nuevo.");
      }
      throw err;
    })
    .finally(() => clearTimeout(timer));
}

async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  // Attempt 1: try with full timeout (handles cold start)
  try {
    return await fetchWithTimeout(url, options);
  } catch {
    // Attempt 2: server should be awake now, retry
    await new Promise((r) => setTimeout(r, 1000));
    return fetchWithTimeout(url, options);
  }
}

export const api = {
  // Máquinas
  async getMaquinas(): Promise<Maquina[]> {
    const res = await fetchWithRetry(`${API_URL}/maquinas`);
    if (!res.ok) throw new Error("Error al obtener máquinas");
    return res.json();
  },

  async getMaquina(id: string): Promise<Maquina> {
    const res = await fetchWithRetry(`${API_URL}/maquinas/${id}`);
    if (!res.ok) throw new Error("Error al obtener máquina");
    return res.json();
  },

  async createMaquina(data: Omit<Maquina, "id" | "created_at">): Promise<Maquina> {
    const res = await fetchWithTimeout(`${API_URL}/maquinas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear máquina");
    return res.json();
  },

  async deleteMaquina(id: string, cascade: boolean = false): Promise<void> {
    const url = cascade
      ? `${API_URL}/maquinas/${id}?cascade=true`
      : `${API_URL}/maquinas/${id}`;
    const res = await fetchWithTimeout(url, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const err: any = new Error(body?.error || "Error al eliminar máquina");
      err.status = res.status;
      err.count = body?.count;
      throw err;
    }
  },

  async updateMaquina(id: string, data: Omit<Maquina, "id" | "created_at">): Promise<Maquina> {
    const res = await fetchWithTimeout(`${API_URL}/maquinas/${id}`, {
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

    const res = await fetchWithTimeout(`${API_URL}/upload?bucket=${bucket}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Error al subir imagen");
    const json = await res.json();
    return json.url;
  },

  async deleteImage(url: string): Promise<void> {
    const res = await fetchWithTimeout(
      `${API_URL}/upload?url=${encodeURIComponent(url)}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Error al eliminar imagen");
  },

  // Mantenimientos
  async getMantenimientos(maquina_id?: string): Promise<Mantenimiento[]> {
    const url = maquina_id
      ? `${API_URL}/mantenimientos?maquina_id=${maquina_id}`
      : `${API_URL}/mantenimientos`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Error al obtener mantenimientos");
    return res.json();
  },

  async getMantenimiento(id: string): Promise<Mantenimiento> {
    const res = await fetchWithRetry(`${API_URL}/mantenimientos/${id}`);
    if (!res.ok) throw new Error("Error al obtener mantenimiento");
    return res.json();
  },

  async createMantenimiento(data: Omit<Mantenimiento, "id" | "created_at" | "maquinas">): Promise<Mantenimiento> {
    const res = await fetchWithTimeout(`${API_URL}/mantenimientos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear mantenimiento");
    return res.json();
  },

  async deleteMantenimiento(id: string, cascade: boolean = false): Promise<void> {
    const url = cascade
      ? `${API_URL}/mantenimientos/${id}?cascade=true`
      : `${API_URL}/mantenimientos/${id}`;
    const res = await fetchWithTimeout(url, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const err: any = new Error(body?.error || "Error al eliminar mantenimiento");
      err.status = res.status;
      err.count = body?.count;
      throw err;
    }
  },

  async updateMantenimiento(id: string, data: Partial<Mantenimiento>): Promise<Mantenimiento> {
    const res = await fetchWithTimeout(`${API_URL}/mantenimientos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar mantenimiento");
    return res.json();
  },

  // Repuestos
  async getRepuestos(mantenimiento_id?: string): Promise<Repuesto[]> {
    const url = mantenimiento_id
      ? `${API_URL}/repuestos?mantenimiento_id=${mantenimiento_id}`
      : `${API_URL}/repuestos`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error("Error al obtener repuestos");
    return res.json();
  },

  async getRepuesto(id: string): Promise<Repuesto> {
    const res = await fetchWithRetry(`${API_URL}/repuestos/${id}`);
    if (!res.ok) throw new Error("Error al obtener repuesto");
    return res.json();
  },

  async createRepuesto(data: Omit<Repuesto, "id" | "created_at" | "mantenimientos">): Promise<Repuesto> {
    const res = await fetchWithTimeout(`${API_URL}/repuestos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al crear repuesto");
    return res.json();
  },

  async deleteRepuesto(id: string): Promise<void> {
    const res = await fetchWithTimeout(`${API_URL}/repuestos/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Error al eliminar repuesto");
    }
  },

  async updateRepuesto(id: string, data: Partial<Repuesto>): Promise<Repuesto> {
    const res = await fetchWithTimeout(`${API_URL}/repuestos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Error al actualizar repuesto");
    return res.json();
  },

  // Health
  async getDbHealth(): Promise<{
    status: string;
    supabase: string;
    database?: { used_mb: number; limit_mb: number; percent: number };
    storage?: { used_mb: number; limit_mb: number; percent: number };
    error?: string;
  }> {
    const res = await fetchWithRetry(`${API_URL}/health/db`);
    return res.json();
  },
};
