import type { Ticket } from "./types";
import { HEADER_ROW_INDEX } from "./types";

export function parseTicketRow(row: unknown[]): Ticket | null {
  const id = row[0];
  if (id === undefined || id === "" || id === null) return null;
  return {
    ID: Number(id),
    Cliente: String(row[1] ?? "").trim(),
    Título: String(row[2] ?? "").trim(),
    Tipo: String(row[3] ?? "").trim(),
    Autor: String(row[4] ?? "").trim(),
    Asignado: String(row[5] ?? "").trim(),
    Prioridad: String(row[6] ?? "").trim(),
    Estado: String(row[7] ?? "").trim(),
    Creación: String(row[8] ?? "").trim(),
    Modificación: String(row[9] ?? "").trim(),
  };
}

/**
 * Convierte matriz de celdas (sheet_to_json con header: 1) en lista de tickets.
 * Asume que los encabezados están en la fila HEADER_ROW_INDEX (ej. 2 = fila 3).
 */
export function rowsToTickets(data: unknown[][]): Ticket[] {
  const tickets: Ticket[] = [];
  for (let i = HEADER_ROW_INDEX + 1; i < data.length; i++) {
    const row = data[i] as unknown[];
    if (!Array.isArray(row)) continue;
    const t = parseTicketRow(row);
    if (t && !Number.isNaN(t.ID)) tickets.push(t);
  }
  return tickets;
}
