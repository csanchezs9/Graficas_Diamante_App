import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Maquina } from "../types/maquina";
import { Mantenimiento } from "../types/mantenimiento";
import { Repuesto } from "../types/repuesto";

function formatMoney(value: number): string {
  return "$" + value.toLocaleString("es-CO");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function generatePDFReport(
  maquinas: Maquina[],
  mantenimientos: Mantenimiento[],
  repuestos: Repuesto[]
): Promise<void> {
  const totalCostoMant = mantenimientos.reduce((s, m) => s + (m.costo_total || 0), 0);
  const totalCostoRep = repuestos.reduce((s, r) => s + (r.costo_unitario || 0) * (r.cantidad_disponible || 0), 0);
  const preventivos = mantenimientos.filter((m) => m.tipo === "preventivo").length;
  const correctivos = mantenimientos.filter((m) => m.tipo === "correctivo").length;

  // Group mantenimientos by maquina
  const mantByMaquina = new Map<string, Mantenimiento[]>();
  mantenimientos.forEach((m) => {
    const list = mantByMaquina.get(m.maquina_id) || [];
    list.push(m);
    mantByMaquina.set(m.maquina_id, list);
  });

  // Group repuestos by mantenimiento
  const repByMant = new Map<string, Repuesto[]>();
  repuestos.forEach((r) => {
    const list = repByMant.get(r.mantenimiento_id) || [];
    list.push(r);
    repByMant.set(r.mantenimiento_id, list);
  });

  const today = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let machinesHtml = "";

  // Sort machines alphabetically
  const sortedMaquinas = [...maquinas].sort((a, b) => a.nombre.localeCompare(b.nombre));

  for (const maq of sortedMaquinas) {
    const mants = mantByMaquina.get(maq.id) || [];
    if (mants.length === 0) continue;

    // Sort mantenimientos by date descending
    mants.sort((a, b) => new Date(b.fecha_realizacion).getTime() - new Date(a.fecha_realizacion).getTime());

    const mantCost = mants.reduce((s, m) => s + (m.costo_total || 0), 0);

    let mantsHtml = "";
    for (const mant of mants) {
      const reps = repByMant.get(mant.id) || [];
      const tipoLabel = mant.tipo === "preventivo" ? "Preventivo" : "Correctivo";
      const tipoColor = mant.tipo === "preventivo" ? "#3B82F6" : "#F59E0B";

      let repsHtml = "";
      if (reps.length > 0) {
        const repsRows = reps
          .map(
            (r) => `
          <tr>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;">${escapeHtml(r.nombre)}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;">${escapeHtml(r.tipo || "-")}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">${r.cantidad_disponible}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(r.costo_unitario)}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${formatMoney(r.costo_unitario * r.cantidad_disponible)}</td>
          </tr>`
          )
          .join("");

        repsHtml = `
        <div style="margin:8px 0 0 16px;">
          <p style="font-size:11px;font-weight:600;color:#555;margin:0 0 4px 0;">Repuestos:</p>
          <table style="width:100%;border-collapse:collapse;font-size:10px;">
            <thead>
              <tr style="background:#f8f8f8;">
                <th style="padding:4px 8px;text-align:left;">Nombre</th>
                <th style="padding:4px 8px;text-align:left;">Tipo</th>
                <th style="padding:4px 8px;text-align:center;">Cant.</th>
                <th style="padding:4px 8px;text-align:right;">Costo Unit.</th>
                <th style="padding:4px 8px;text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>${repsRows}</tbody>
          </table>
        </div>`;
      }

      mantsHtml += `
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:12px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:600;">${formatDate(mant.fecha_realizacion)}</span>
          <span style="font-size:10px;font-weight:600;color:${tipoColor};background:${tipoColor}15;padding:2px 8px;border-radius:10px;">${tipoLabel}</span>
        </div>
        <p style="font-size:11px;color:#333;margin:0 0 4px 0;">${escapeHtml(mant.descripcion)}</p>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:#888;">
          <span>Tecnico: ${escapeHtml(mant.tecnico_responsable)}</span>
          <span style="font-weight:600;color:#333;">${formatMoney(mant.costo_total)}</span>
        </div>
        ${repsHtml}
      </div>`;
    }

    machinesHtml += `
    <div style="page-break-inside:avoid;margin-bottom:24px;">
      <div style="background:#f0f4ff;border-radius:8px;padding:12px 16px;margin-bottom:10px;">
        <h2 style="margin:0;font-size:15px;color:#1a1a1a;">${escapeHtml(maq.nombre)}</h2>
        <p style="margin:2px 0 0;font-size:11px;color:#666;">
          Codigo: ${escapeHtml(maq.codigo || "-")} · Ubicacion: ${escapeHtml(maq.ubicacion || "-")} · ${mants.length} mantenimiento(s) · Total: ${formatMoney(mantCost)}
        </p>
      </div>
      ${mantsHtml}
    </div>`;
  }

  if (!machinesHtml) {
    machinesHtml = `<p style="text-align:center;color:#999;padding:40px 0;">No hay registros de mantenimiento.</p>`;
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 24px; margin: 0; font-size: 12px; }
      .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #3B82F6; padding-bottom: 16px; }
      .header h1 { margin: 0; font-size: 22px; color: #1a1a1a; }
      .header p { margin: 4px 0 0; color: #888; font-size: 12px; }
      .summary { display: flex; gap: 12px; margin-bottom: 28px; }
      .summary-card { flex: 1; background: #f8f9fa; border-radius: 8px; padding: 14px; text-align: center; }
      .summary-card .value { font-size: 20px; font-weight: 700; color: #1a1a1a; }
      .summary-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Reporte de Mantenimientos</h1>
      <p>Graficas Diamante · Generado el ${today}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="value">${mantenimientos.length}</div>
        <div class="label">Mantenimientos</div>
      </div>
      <div class="summary-card">
        <div class="value">${preventivos}</div>
        <div class="label">Preventivos</div>
      </div>
      <div class="summary-card">
        <div class="value">${correctivos}</div>
        <div class="label">Correctivos</div>
      </div>
      <div class="summary-card">
        <div class="value">${formatMoney(totalCostoMant)}</div>
        <div class="label">Costo Mantenimientos</div>
      </div>
      <div class="summary-card">
        <div class="value">${formatMoney(totalCostoRep)}</div>
        <div class="label">Costo Repuestos</div>
      </div>
    </div>

    ${machinesHtml}

    <div style="text-align:center;color:#ccc;font-size:9px;margin-top:32px;border-top:1px solid #eee;padding-top:12px;">
      Graficas Diamante App · Reporte generado automaticamente
    </div>
  </body>
  </html>`;

  await printOrShare(html);
}

async function printOrShare(html: string): Promise<void> {
  if (Platform.OS === "web") {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.onload = () => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      };
    }
  } else {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  }
}

export async function generateRepuestasPDF(repuestos: Repuesto[]): Promise<void> {
  const today = new Date().toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const totalUnidades = repuestos.reduce((s, r) => s + (r.cantidad_disponible || 0), 0);

  const sorted = [...repuestos].sort((a, b) => a.nombre.localeCompare(b.nombre));

  const rows = sorted
    .map((r, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f9f9f9"}"><td style="padding:5px 8px;border-bottom:1px solid #eee;color:#888;font-size:10px;">${i + 1}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;">${escapeHtml(r.nombre)}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;color:#555;">${escapeHtml(r.codigo || "—")}</td><td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:600;">${r.cantidad_disponible}</td></tr>`)
    .join("");

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; padding: 24px; margin: 0; font-size: 12px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #3B82F6; padding-bottom: 14px; }
      .header h1 { margin: 0; font-size: 20px; color: #1a1a1a; }
      .header p { margin: 4px 0 0; color: #888; font-size: 11px; }
      .summary { display: flex; gap: 12px; margin-bottom: 20px; }
      .summary-card { flex: 1; background: #f8f9fa; border-radius: 8px; padding: 12px; text-align: center; }
      .summary-card .value { font-size: 18px; font-weight: 700; color: #1a1a1a; }
      .summary-card .label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { background: #f0f4ff; padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
      th:last-child { text-align: center; }
      .footer { text-align: center; color: #ccc; font-size: 9px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Inventario de Repuestos</h1>
      <p>Graficas Diamante · Generado el ${today}</p>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="value">${repuestos.length}</div>
        <div class="label">Repuestos</div>
      </div>
      <div class="summary-card">
        <div class="value">${totalUnidades}</div>
        <div class="label">Unidades totales</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:32px;">#</th>
          <th>Nombre</th>
          <th>Código</th>
          <th style="text-align:center;">Cantidad</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">Graficas Diamante App · Inventario generado automaticamente</div>
  </body>
  </html>`;

  await printOrShare(html);
}
