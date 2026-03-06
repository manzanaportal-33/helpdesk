"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import type { SlaMatrixEntry } from "@/lib/types";

function rowToEntry(row: Record<string, unknown>): SlaMatrixEntry {
  return {
    id: Number(row.id),
    comercial: String(row.comercial ?? ""),
    cliente: String(row.cliente ?? ""),
    producto: String(row.producto ?? ""),
    nivelEmergencia: String(row.nivel_emergencia ?? ""),
    descripcion: String(row.descripcion ?? ""),
    tiempoRespuestaMinMinutos: row.tiempo_respuesta_min_minutos === null || row.tiempo_respuesta_min_minutos === undefined
      ? null
      : Number(row.tiempo_respuesta_min_minutos),
    tiempoRespuestaMaxMinutos: row.tiempo_respuesta_max_minutos === null || row.tiempo_respuesta_max_minutos === undefined
      ? null
      : Number(row.tiempo_respuesta_max_minutos),
    tiempoRespuestaRaw: String(row.tiempo_respuesta_raw ?? ""),
    diagnosticoMinHoras: row.diagnostico_min_horas === null || row.diagnostico_min_horas === undefined ? null : Number(row.diagnostico_min_horas),
    diagnosticoMaxHoras: row.diagnostico_max_horas === null || row.diagnostico_max_horas === undefined ? null : Number(row.diagnostico_max_horas),
    horarioSla: String(row.horario_sla ?? ""),
  };
}

function parseTiempoRespuesta(value: unknown): { min: number | null; max: number | null; raw: string } {
  if (value === null || value === undefined) return { min: null, max: null, raw: "" };

  if (typeof value === "number" && Number.isFinite(value)) {
    return { min: Math.round(value), max: Math.round(value), raw: String(value) };
  }

  const raw = String(value).trim();
  if (!raw) return { min: null, max: null, raw: "" };

  const normalized = raw
    .replace(/minutos?/gi, "min")
    .replace(/\s+/g, " ")
    .trim();

  // formatos tipo "0 - 60 Minutos"
  const range = normalized.match(/(\d+)\s*-\s*(\d+)\s*min/i);
  if (range) {
    const a = Number(range[1]);
    const b = Number(range[2]);
    return { min: Number.isFinite(a) ? a : null, max: Number.isFinite(b) ? b : null, raw };
  }

  // formato tipo "60 Min" o "60"
  const single = normalized.match(/(\d+)\s*(min)?/i);
  if (single) {
    const n = Number(single[1]);
    return { min: Number.isFinite(n) ? n : null, max: Number.isFinite(n) ? n : null, raw };
  }

  return { min: null, max: null, raw };
}

export default function SlaPage() {
  const [entries, setEntries] = useState<SlaMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const [cliente, setCliente] = useState("");
  const [producto, setProducto] = useState("");
  const [nivel, setNivel] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Supabase no configurado. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setError(null);
    supabase
      .from("sla_matrix")
      .select("*")
      .order("cliente", { ascending: true })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        setEntries((data ?? []).map((r) => rowToEntry(r)));
      });
  }, []);

  const clientesList = useMemo(() => {
    const set = new Set(entries.map((e) => e.cliente).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const productosList = useMemo(() => {
    const base = cliente ? entries.filter((e) => e.cliente === cliente) : entries;
    const set = new Set(base.map((e) => e.producto).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries, cliente]);

  const nivelesList = useMemo(() => {
    const base = entries;
    const set = new Set(base.map((e) => e.nivelEmergencia).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (cliente && e.cliente !== cliente) return false;
      if (producto && e.producto !== producto) return false;
      if (nivel && e.nivelEmergencia !== nivel) return false;
      return true;
    });
  }, [entries, cliente, producto, nivel]);

  const handleImportClick = () => {
    const input = document.getElementById("sla-input") as HTMLInputElement | null;
    input?.click();
  };

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!supabase) {
      setError("Supabase no configurado.");
      return;
    }
    setImporting(true);
    setError(null);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const list = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
      if (!list.length) throw new Error("El Excel no tiene filas con datos.");

      const rows = list.map((r) => {
        const tr = parseTiempoRespuesta(r["Tiempo_Respuesta_Minutos"]);
        return {
          comercial: String(r["Comercial"] ?? ""),
          cliente: String(r["Cliente"] ?? ""),
          producto: String(r["Producto"] ?? ""),
          nivel_emergencia: String(r["Nivel_Emergencia"] ?? ""),
          descripcion: String(r["Descripcion"] ?? ""),
          tiempo_respuesta_min_minutos: tr.min,
          tiempo_respuesta_max_minutos: tr.max,
          tiempo_respuesta_raw: tr.raw,
          diagnostico_min_horas: r["Diagnostico_Min_Horas"] === null || r["Diagnostico_Min_Horas"] === undefined ? null : Number(r["Diagnostico_Min_Horas"]),
          diagnostico_max_horas: r["Diagnostico_Max_Horas"] === null || r["Diagnostico_Max_Horas"] === undefined ? null : Number(r["Diagnostico_Max_Horas"]),
          horario_sla: String(r["Horario_SLA"] ?? ""),
        };
      }).filter((r) => r.cliente || r.producto || r.nivel_emergencia);

      const { error: upsertErr } = await supabase
        .from("sla_matrix")
        .upsert(rows, { onConflict: "cliente,producto,nivel_emergencia,horario_sla,descripcion" });
      if (upsertErr) throw new Error(upsertErr.message);

      const { data: refreshed, error: refreshErr } = await supabase
        .from("sla_matrix")
        .select("*")
        .order("cliente", { ascending: true });
      if (refreshErr) throw new Error(refreshErr.message);
      setEntries((refreshed ?? []).map((r) => rowToEntry(r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al importar el Excel");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-sky-50/40 to-zinc-100 dark:from-zinc-950 dark:via-sky-950/20 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
            Matriz SLA
          </h1>
        </header>

        {!supabase && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-800 dark:text-amber-200 text-sm">
            Supabase no configurado. Configurá las variables de entorno para guardar y leer la matriz SLA.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">Datos de SLA</p>
            <p>Importá el Excel para cargar o actualizar la matriz por cliente y producto.</p>
            {importing && <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Importando…</p>}
          </div>
          <div className="flex items-center gap-2">
            <input id="sla-input" type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
            <button
              type="button"
              onClick={handleImportClick}
              disabled={!supabase || importing}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#05397f] disabled:opacity-60"
              style={{ backgroundColor: "#05397f" }}
            >
              Importar Excel
            </button>
          </div>
        </div>

        <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cliente</label>
              <select
                value={cliente}
                onChange={(e) => {
                  setCliente(e.target.value);
                  setProducto("");
                }}
                className="min-w-[220px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {clientesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Producto</label>
              <select
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                className="min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {productosList.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nivel</label>
              <select
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
                className="min-w-[220px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                {nivelesList.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="ml-auto text-sm text-zinc-600 dark:text-zinc-400">
              Mostrando <strong>{filtered.length}</strong> filas
            </div>
          </div>
        </div>

        <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                <tr>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Cliente</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Producto</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Nivel</th>
                  <th className="text-left py-2.5 px-3 font-medium min-w-[280px]">Descripción</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Respuesta</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Diag. min (h)</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Diag. max (h)</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Horario</th>
                  <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Comercial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {loading ? (
                  <tr>
                    <td className="py-6 px-3 text-center text-zinc-500 dark:text-zinc-400" colSpan={9}>
                      Cargando…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="py-6 px-3 text-center text-zinc-500 dark:text-zinc-400" colSpan={9}>
                      No hay filas para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="py-2 px-3 whitespace-nowrap">{e.cliente || "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{e.producto || "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{e.nivelEmergencia || "—"}</td>
                      <td className="py-2 px-3 max-w-[420px] truncate" title={e.descripcion}>{e.descripcion || "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {e.tiempoRespuestaMinMinutos !== null || e.tiempoRespuestaMaxMinutos !== null
                          ? e.tiempoRespuestaMinMinutos === e.tiempoRespuestaMaxMinutos
                            ? `${e.tiempoRespuestaMinMinutos ?? ""} min`
                            : `${e.tiempoRespuestaMinMinutos ?? "?"}–${e.tiempoRespuestaMaxMinutos ?? "?"} min`
                          : e.tiempoRespuestaRaw || "—"}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">{e.diagnosticoMinHoras ?? "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{e.diagnosticoMaxHoras ?? "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{e.horarioSla || "—"}</td>
                      <td className="py-2 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{e.comercial || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

