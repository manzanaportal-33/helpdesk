"use client";

import { useCallback, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { rowsToTickets } from "@/lib/parseExcel";
import { groupBy, sortByCount, byMonth, ticketsCerrados, ticketsAbiertos, ttrPromedioHoras, cumplimientoSlaPct, tiempoVidaPromedioAbiertos, casosAbiertosPorCliente } from "@/lib/analytics";
import type { Ticket } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#14b8a6", "#f97316"];

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDateTime(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

export default function AnalisisPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [area, setArea] = useState("Mesa de Ayuda");
  const [subarea, setSubarea] = useState("Mesa de Ayuda");
  const [cliente, setCliente] = useState<string>("");
  const [autor, setAutor] = useState<string>("");
  const [prioridad, setPrioridad] = useState<string>("");
  const [estado, setEstado] = useState<string>("");
  const [asignado, setAsignado] = useState<string>("");
  const [slaTargetHoras, setSlaTargetHoras] = useState(24);
  const [selectedSegment, setSelectedSegment] = useState<{ type: string; value: string } | null>(null);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result;
        if (!data || typeof data === "string") throw new Error("Archivo no válido");
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
        const list = rowsToTickets(raw);
        setTickets(list);
        setCliente("");
        setAutor("");
        setPrioridad("");
        setEstado("");
        setAsignado("");
        const dates = list.map((t) => parseDate(t.Creación)).filter(Boolean) as Date[];
        if (dates.length > 0) {
          const min = new Date(Math.min(...dates.map((d) => d.getTime())));
          const max = new Date(Math.max(...dates.map((d) => d.getTime())));
          setDesde(toInputDate(min));
          setHasta(toInputDate(max));
        } else {
          setDesde("");
          setHasta("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al leer el Excel");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const creacion = parseDate(t.Creación);
      if (desde && creacion) {
        const dDesde = new Date(desde);
        dDesde.setHours(0, 0, 0, 0);
        if (creacion < dDesde) return false;
      }
      if (hasta && creacion) {
        const dHasta = new Date(hasta);
        dHasta.setHours(23, 59, 59, 999);
        if (creacion > dHasta) return false;
      }
      if (cliente && t.Cliente !== cliente) return false;
      if (autor && t.Autor !== autor) return false;
      if (prioridad && t.Prioridad !== prioridad) return false;
      if (estado && t.Estado !== estado) return false;
      if (asignado && t.Asignado !== asignado) return false;
      return true;
    });
  }, [tickets, desde, hasta, cliente, autor, prioridad, estado, asignado]);

  const clientesList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Cliente).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const autoresList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Autor).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const prioridadesList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Prioridad).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const estadosList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Estado).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const asignadosList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Asignado).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const byCliente = sortByCount(groupBy(filteredTickets, "Cliente"), 12);
  const byPrioridad = sortByCount(groupBy(filteredTickets, "Prioridad"));
  const byEstado = sortByCount(groupBy(filteredTickets, "Estado"));
  const byTipo = sortByCount(groupBy(filteredTickets, "Tipo"));
  const byMonthCreacion = byMonth(filteredTickets, "Creación");

  const ticketsOrdenados = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      const da = parseDate(a.Creación)?.getTime() ?? 0;
      const db = parseDate(b.Creación)?.getTime() ?? 0;
      return db - da;
    });
  }, [filteredTickets]);

  const ticketsToShow = useMemo(() => {
    if (!selectedSegment) return ticketsOrdenados;
    return ticketsOrdenados.filter((t) => {
      const v = String((t as unknown as Record<string, unknown>)[selectedSegment.type] ?? "").trim();
      return v === selectedSegment.value;
    });
  }, [ticketsOrdenados, selectedSegment]);

  const cerrados = useMemo(() => ticketsCerrados(filteredTickets), [filteredTickets]);
  const abiertos = useMemo(() => ticketsAbiertos(filteredTickets), [filteredTickets]);
  const ttrHoras = useMemo(() => ttrPromedioHoras(filteredTickets), [filteredTickets]);
  const slaPct = useMemo(() => cumplimientoSlaPct(filteredTickets, slaTargetHoras), [filteredTickets, slaTargetHoras]);
  const tiempoVidaAbiertos = useMemo(() => tiempoVidaPromedioAbiertos(filteredTickets), [filteredTickets]);
  const abiertosPorCliente = useMemo(() => casosAbiertosPorCliente(filteredTickets), [filteredTickets]);
  const porAsignado = useMemo(
    () => sortByCount(groupBy(filteredTickets, "Asignado")).slice(0, 10),
    [filteredTickets]
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Análisis de tickets · Mesa de Ayuda</h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Subí el Excel de la bandeja de equipo para ver métricas por cliente, severidad y más.
              </p>
            </div>
            <a
              href="/"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← Inicio
            </a>
          </div>
        </header>

        <div
          className="border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-8 text-center bg-white dark:bg-zinc-900"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
              const input = document.getElementById("excel-input") as HTMLInputElement;
              if (input) {
                const dt = new DataTransfer();
                dt.items.add(f);
                input.files = dt.files;
                input.dispatchEvent(new Event("change", { bubbles: true }));
              }
            }
          }}
        >
          <input
            id="excel-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={onFile}
            className="sr-only"
          />
          <label htmlFor="excel-input" className="cursor-pointer">
            <span className="text-zinc-600 dark:text-zinc-400 block mb-2">
              {loading ? "Leyendo..." : "Arrastrá el Excel acá o hacé clic para elegir"}
            </span>
            <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Seleccionar archivo
            </span>
          </label>
          {error && <p className="mt-3 text-red-600 dark:text-red-400">{error}</p>}
        </div>

        {tickets.length > 0 && (
          <>
            {/* Barra de filtros */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Desde</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={desde}
                      onChange={(e) => setDesde(e.target.value)}
                      className="w-full min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 pr-9 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <CalendarIcon />
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hasta</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={hasta}
                      onChange={(e) => setHasta(e.target.value)}
                      className="w-full min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 pr-9 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                      <CalendarIcon />
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Área</label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="min-w-[160px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Mesa de Ayuda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subárea</label>
                  <select
                    value={subarea}
                    onChange={(e) => setSubarea(e.target.value)}
                    className="min-w-[160px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>Mesa de Ayuda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cliente</label>
                  <select
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="min-w-[200px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {clientesList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Autor</label>
                  <select
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    className="min-w-[180px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar autor...</option>
                    {autoresList.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {prioridadesList.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Estado</label>
                  <select
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    className="min-w-[160px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {estadosList.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Asignado</label>
                  <select
                    value={asignado}
                    onChange={(ev) => setAsignado(ev.target.value)}
                    className="min-w-[180px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar asignado...</option>
                    {asignadosList.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(desde || hasta || cliente || autor || prioridad || estado || asignado || selectedSegment) && (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Mostrando {filteredTickets.length} de {tickets.length} tickets
                  {selectedSegment && (
                    <span className="ml-2">
                      · Clic en gráfico: {selectedSegment.type} = {selectedSegment.value}
                      <button
                        type="button"
                        onClick={() => setSelectedSegment(null)}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Limpiar
                      </button>
                    </span>
                  )}
                </p>
              )}
            </div>

            {ticketsToShow.length > 0 && (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(ticketsToShow);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Tickets");
                    XLSX.writeFile(wb, `tickets-filtrados-${new Date().toISOString().slice(0, 10)}.xlsx`);
                  }}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  Descargar Excel
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total tickets</p>
                <p className="text-2xl font-bold">{filteredTickets.length}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Clientes</p>
                <p className="text-2xl font-bold">{new Set(filteredTickets.map((t) => t.Cliente)).size}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Urgentes</p>
                <p className="text-2xl font-bold">
                  {filteredTickets.filter((t) => t.Prioridad === "Urgente").length}
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Abiertos (no resueltos)</p>
                <p className="text-2xl font-bold">
                  {
                    filteredTickets.filter(
                      (t) =>
                        t.Estado !== "Resuelto" &&
                        t.Estado !== "Cerrado" &&
                        t.Estado !== "Rechazado"
                    ).length
                  }
                </p>
              </div>
            </div>

            {/* Métricas SLA y desempeño */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
              <h2 className="font-semibold text-lg mb-4">Métricas SLA y desempeño</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Cumplimiento SLA</p>
                  {cerrados.length === 0 ? (
                    <p className="text-sm text-zinc-500 mt-1">Sin casos cerrados</p>
                  ) : (
                    <>
                      <p className="text-xl font-bold mt-0.5">{slaPct ?? "—"}%</p>
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1 flex-wrap">
                        Resueltos en ≤
                        <input
                          type="number"
                          min={1}
                          max={720}
                          value={slaTargetHoras}
                          onChange={(e) => setSlaTargetHoras(Number(e.target.value) || 24)}
                          className="w-12 rounded border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800 px-1 py-0.5 text-xs"
                          title="Objetivo SLA en horas"
                        />
                        h
                      </p>
                    </>
                  )}
                </div>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">FTR</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Tiempo primera respuesta</p>
                  <p className="text-xs text-zinc-500 mt-1">Requiere columna &quot;Fecha primera respuesta&quot; en el reporte</p>
                </div>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide">CSAT</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Puntaje de satisfacción</p>
                  <p className="text-xs text-zinc-500 mt-1">Requiere columna &quot;Puntaje satisfacción&quot; en el reporte</p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">TTR</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Tiempo promedio de resolución</p>
                  {ttrHoras === null ? (
                    <p className="text-sm text-zinc-500 mt-0.5">Sin casos cerrados</p>
                  ) : (
                    <p className="text-xl font-bold mt-0.5">
                      {ttrHoras < 24 ? `${ttrHoras.toFixed(1)} h` : `${(ttrHoras / 24).toFixed(1)} días`}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Tiempo de vida</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Casos abiertos (promedio)</p>
                  {tiempoVidaAbiertos === null ? (
                    <p className="text-sm text-zinc-500 mt-0.5">Sin casos abiertos</p>
                  ) : (
                    <p className="text-xl font-bold mt-0.5">{tiempoVidaAbiertos.toFixed(1)} días</p>
                  )}
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Casos abiertos</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Cantidad</p>
                  <p className="text-xl font-bold mt-0.5">{abiertos.length}</p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Por cliente</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">Ver gráfico abajo</p>
                </div>
              </div>
              {abiertosPorCliente.length > 0 && (
                <div className="mt-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-medium mb-3">Casos abiertos por cliente</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={abiertosPorCliente.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#dc2626" name="Abiertos" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Listado de tickets filtrados */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="font-semibold text-lg">Tickets del reporte</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {filteredTickets.length === 0
                    ? "No hay tickets con los filtros aplicados."
                    : `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? "s" : ""} (ordenados por fecha de creación, más recientes primero)`}
                </p>
              </div>
              {filteredTickets.length > 0 && (
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      <tr>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">ID</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Cliente</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Autor</th>
                        <th className="text-left py-2.5 px-3 font-medium min-w-[200px]">Título</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Tipo</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Prioridad</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Estado</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Creación</th>
                        <th className="text-left py-2.5 px-3 font-medium whitespace-nowrap">Asignado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {ticketsToShow.map((t) => (
                        <tr key={t.ID} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400">{t.ID}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{t.Cliente || "—"}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{t.Autor || "—"}</td>
                          <td className="py-2 px-3 max-w-[280px] truncate" title={t.Título}>{t.Título || "—"}</td>
                          <td className="py-2 px-3 whitespace-nowrap">{t.Tipo || "—"}</td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={
                                t.Prioridad === "Urgente"
                                  ? "text-red-600 dark:text-red-400 font-medium"
                                  : t.Prioridad === "Alta"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : ""
                              }
                            >
                              {t.Prioridad || "—"}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">{t.Estado || "—"}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {formatDateTime(t.Creación)}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                            {t.Asignado || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <h2 className="font-semibold mb-4">Por cliente (top 12)</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byCliente} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        name="Tickets"
                        radius={[0, 4, 4, 0]}
                        onClick={(data: { name?: string }) => data?.name && setSelectedSegment({ type: "Cliente", value: data.name })}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <h2 className="font-semibold mb-4">Por prioridad</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byPrioridad}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, value }) => `${name}: ${value}`}
                        onClick={(data: { name?: string }) => data?.name && setSelectedSegment({ type: "Prioridad", value: data.name })}
                      >
                        {byPrioridad.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <h2 className="font-semibold mb-4">Por estado</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byEstado} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#8b5cf6"
                        name="Tickets"
                        radius={[4, 4, 0, 0]}
                        onClick={(data: { name?: string }) => data?.name && setSelectedSegment({ type: "Estado", value: data.name })}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <h2 className="font-semibold mb-4">Por tipo</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byTipo} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        name="Tickets"
                        radius={[4, 4, 0, 0]}
                        onClick={(data: { name?: string }) => data?.name && setSelectedSegment({ type: "Tipo", value: data.name })}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Por asignado */}
            {porAsignado.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <h2 className="font-semibold mb-4">Por asignado</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={porAsignado} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar
                        dataKey="value"
                        fill="#6366f1"
                        name="Tickets"
                        radius={[0, 4, 4, 0]}
                        onClick={(data: { name?: string }) => data?.name && setSelectedSegment({ type: "Asignado", value: data.name })}
                        style={{ cursor: "pointer" }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {byMonthCreacion.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                <h2 className="font-semibold mb-4">Tickets por mes (fecha de creación)</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byMonthCreacion}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#f59e0b" name="Tickets" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
