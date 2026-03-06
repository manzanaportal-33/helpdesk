"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase, rowToTicket } from "@/lib/supabase";
import type { Ticket } from "@/lib/types";

const COLUMN_ORDER = [
  "Pendiente",
  "Asignado",
  "En Curso",
  "En Espera",
  "En Revisión",
  "Devuelto",
  "Resuelto",
  "Cerrado",
  "Rechazado",
];

function formatDate(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TableroPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Supabase no configurado. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setError(null);
    supabase
      .from("tickets")
      .select("*")
      .order("creacion", { ascending: false })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        setTickets((data ?? []).map(rowToTicket));
      });
  }, []);

  const columns = useMemo(() => {
    const byEstado = new Map<string, Ticket[]>();
    for (const t of tickets) {
      const e = t.Estado?.trim() || "Sin estado";
      if (!byEstado.has(e)) byEstado.set(e, []);
      byEstado.get(e)!.push(t);
    }
    const ordered: string[] = [];
    for (const name of COLUMN_ORDER) {
      if (byEstado.has(name)) ordered.push(name);
    }
    for (const name of byEstado.keys()) {
      if (!COLUMN_ORDER.includes(name)) ordered.push(name);
    }
    return ordered.map((name) => ({ name, tickets: byEstado.get(name) ?? [] }));
  }, [tickets]);

  const changeEstado = async (ticketId: number, nuevoEstado: string) => {
    if (!supabase) return;
    setUpdatingId(ticketId);
    const { error } = await supabase.from("tickets").update({ estado: nuevoEstado }).eq("ticket_id", ticketId);
    setUpdatingId(null);
    if (error) {
      console.error("Error al actualizar estado:", error);
      return;
    }
    setTickets((prev) =>
      prev.map((t) => (t.ID === ticketId ? { ...t, Estado: nuevoEstado } : t))
    );
  };

  const estadosList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Estado).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-sky-50/40 to-zinc-100 dark:from-zinc-950 dark:via-sky-950/20 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Inicio
            </a>
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md shadow-sm"
                style={{ backgroundColor: "#05397f" }}
              >
                <span className="text-white text-sm font-semibold leading-none">//</span>
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Helpdesk</span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#05397f" }}>
            Tablero de seguimiento de incidencias
          </h1>
        </header>

        {!supabase && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-800 dark:text-amber-200 text-sm">
            Supabase no configurado. Configurá las variables de entorno para cargar y actualizar incidencias desde la base de datos.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
            Cargando incidencias…
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#f8f9fa] dark:bg-zinc-900 p-8 text-center text-zinc-600 dark:text-zinc-400">
            No hay tickets cargados. Cargá datos desde <a href="/analisis" className="text-[#05397f] hover:underline">Análisis de Tickets</a> (importar Excel) para ver el tablero.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {columns.map((col) => (
                <div
                  key={col.name}
                  className="flex-shrink-0 w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#f8f9fa] dark:bg-zinc-900 shadow-sm overflow-hidden"
                >
                  <div
                    className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-700 font-semibold text-sm flex items-center justify-between"
                    style={{ color: "#05397f", backgroundColor: "rgba(5, 57, 127, 0.08)" }}
                  >
                    <span>{col.name}</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-normal">{col.tickets.length}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                    {col.tickets.map((t) => (
                      <div
                        key={t.ID}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-3 shadow-sm hover:shadow transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">#{t.ID}</span>
                          {estadosList.length > 0 && (
                            <select
                              value={t.Estado}
                              onChange={(e) => changeEstado(t.ID, e.target.value)}
                              disabled={updatingId === t.ID}
                              className="text-[10px] rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 max-w-[100px] truncate"
                            >
                              {estadosList.map((est) => (
                                <option key={est} value={est}>{est}</option>
                              ))}
                            </select>
                          )}
                        </div>
                        <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2" title={t.Título}>
                          {t.Título || "Sin título"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 truncate" title={t.Cliente}>
                          {t.Cliente || "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {t.Prioridad && (
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                t.Prioridad === "Urgente"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                                  : t.Prioridad === "Alta"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {t.Prioridad}
                            </span>
                          )}
                          {t.Asignado && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[120px]" title={t.Asignado}>
                              {t.Asignado}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                          {formatDate(t.Creación)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
