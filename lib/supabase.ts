import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function createSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

const _client = createSupabaseClient();

export const supabase = _client as SupabaseClient | null;

/** Mapeo de fila de Supabase a Ticket */
export interface TicketRow {
  id?: number;
  ticket_id: number;
  cliente: string;
  titulo: string;
  tipo: string;
  autor: string;
  asignado: string;
  prioridad: string;
  estado: string;
  creacion: string;
  modificacion: string;
}

export function rowToTicket(row: TicketRow) {
  return {
    ID: row.ticket_id,
    Cliente: row.cliente ?? "",
    Título: row.titulo ?? "",
    Tipo: row.tipo ?? "",
    Autor: row.autor ?? "",
    Asignado: row.asignado ?? "",
    Prioridad: row.prioridad ?? "",
    Estado: row.estado ?? "",
    Creación: row.creacion ?? "",
    Modificación: row.modificacion ?? "",
  };
}

export function ticketToRow(t: { ID: number; Cliente: string; Título: string; Tipo: string; Autor: string; Asignado: string; Prioridad: string; Estado: string; Creación: string; Modificación: string }): TicketRow {
  return {
    ticket_id: t.ID,
    cliente: t.Cliente,
    titulo: t.Título,
    tipo: t.Tipo,
    autor: t.Autor,
    asignado: t.Asignado,
    prioridad: t.Prioridad,
    estado: t.Estado,
    creacion: t.Creación,
    modificacion: t.Modificación,
  };
}
