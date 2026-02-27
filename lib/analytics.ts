import type { Ticket } from "./types";

export function groupBy<K extends keyof Ticket>(
  tickets: Ticket[],
  key: K
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of tickets) {
    const v = String(t[key] ?? "").trim();
    const label = v || "(sin valor)";
    out[label] = (out[label] ?? 0) + 1;
  }
  return out;
}

export function sortByCount(
  counts: Record<string, number>,
  limit?: number
): { name: string; value: number }[] {
  const arr = Object.entries(counts).map(([name, value]) => ({ name, value }));
  arr.sort((a, b) => b.value - a.value);
  return limit ? arr.slice(0, limit) : arr;
}

export function byMonth(tickets: Ticket[], dateKey: "Creación" | "Modificación") {
  const byMonth: Record<string, number> = {};
  for (const t of tickets) {
    const raw = t[dateKey] ?? "";
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }
  const arr = Object.entries(byMonth)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return arr;
}

const ESTADOS_CERRADOS = ["Resuelto", "Cerrado"];
const ESTADOS_ABIERTOS_EXCLUIDOS = ["Resuelto", "Cerrado", "Rechazado"];

export function ticketsCerrados(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => ESTADOS_CERRADOS.includes(t.Estado));
}

export function ticketsAbiertos(tickets: Ticket[]): Ticket[] {
  return tickets.filter((t) => !ESTADOS_ABIERTOS_EXCLUIDOS.includes(t.Estado));
}

/** Tiempo de resolución en horas (Modificación - Creación). Devuelve null si no se puede calcular. */
export function tiempoResolucionHoras(t: Ticket): number | null {
  const creacion = t.Creación ? new Date(t.Creación) : null;
  const modificacion = t.Modificación ? new Date(t.Modificación) : null;
  if (!creacion || !modificacion || Number.isNaN(creacion.getTime()) || Number.isNaN(modificacion.getTime()))
    return null;
  return (modificacion.getTime() - creacion.getTime()) / (1000 * 60 * 60);
}

/** TTR en horas (promedio). Solo tickets cerrados. */
export function ttrPromedioHoras(tickets: Ticket[]): number | null {
  const cerrados = ticketsCerrados(tickets);
  const horas = cerrados.map(tiempoResolucionHoras).filter((h): h is number => h !== null);
  if (horas.length === 0) return null;
  return horas.reduce((a, b) => a + b, 0) / horas.length;
}

/** % de tickets cerrados que se resolvieron en ≤ targetHoras. */
export function cumplimientoSlaPct(tickets: Ticket[], targetHoras: number): number | null {
  const cerrados = ticketsCerrados(tickets);
  if (cerrados.length === 0) return null;
  const dentro = cerrados.filter((t) => {
    const h = tiempoResolucionHoras(t);
    return h !== null && h <= targetHoras;
  }).length;
  return Math.round((dentro / cerrados.length) * 100);
}

/** Edad en días de un ticket abierto (desde Creación hasta ahora). */
export function diasAbierto(t: Ticket): number {
  const creacion = t.Creación ? new Date(t.Creación) : null;
  if (!creacion || Number.isNaN(creacion.getTime())) return 0;
  return (Date.now() - creacion.getTime()) / (1000 * 60 * 60 * 24);
}

/** Promedio de días abiertos para tickets abiertos. */
export function tiempoVidaPromedioAbiertos(tickets: Ticket[]): number | null {
  const abiertos = ticketsAbiertos(tickets);
  if (abiertos.length === 0) return null;
  const dias = abiertos.map(diasAbierto);
  return dias.reduce((a, b) => a + b, 0) / dias.length;
}

/** Casos abiertos agrupados por cliente. */
export function casosAbiertosPorCliente(tickets: Ticket[]): { name: string; value: number }[] {
  const abiertos = ticketsAbiertos(tickets);
  return sortByCount(groupBy(abiertos, "Cliente"));
}
