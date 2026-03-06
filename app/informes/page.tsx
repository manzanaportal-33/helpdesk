"use client";

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase, rowToTicket } from "@/lib/supabase";
import type { Client, SlaMatrixEntry, Task, Ticket } from "@/lib/types";
import {
  byMonth,
  casosAbiertosPorCliente,
  cumplimientoSlaPct,
  groupBy,
  sortByCount,
  ticketsAbiertos,
  ticketsCerrados,
  ttrPromedioHoras,
  tiempoVidaPromedioAbiertos,
} from "@/lib/analytics";

const COLORS = ["#05397f", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"];

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: Number(row.id),
    titulo: String(row.titulo ?? ""),
    descripcion: String(row.descripcion ?? ""),
    responsable: String(row.responsable ?? ""),
    prioridad: String(row.prioridad ?? ""),
    estado: String(row.estado ?? "Pendiente"),
    fechaCreacion: String(row.fecha_creacion ?? ""),
    fechaVencimiento: row.fecha_vencimiento ? String(row.fecha_vencimiento) : null,
  };
}

function rowToClient(row: Record<string, unknown>): Client {
  return {
    id: Number(row.id),
    nombre: String(row.nombre ?? ""),
    producto: String(row.producto ?? ""),
    fechaContratoInicio: row.fecha_contrato_inicio ? String(row.fecha_contrato_inicio) : null,
    fechaContratoFin: row.fecha_contrato_fin ? String(row.fecha_contrato_fin) : null,
    contactoNombre: String(row.contacto_nombre ?? ""),
    contactoEmail: String(row.contacto_email ?? ""),
    contactoTelefono: String(row.contacto_telefono ?? ""),
    notas: String(row.notas ?? ""),
  };
}

function rowToSla(row: Record<string, unknown>): SlaMatrixEntry {
  return {
    id: Number(row.id),
    comercial: String(row.comercial ?? ""),
    cliente: String(row.cliente ?? ""),
    producto: String(row.producto ?? ""),
    nivelEmergencia: String(row.nivel_emergencia ?? ""),
    descripcion: String(row.descripcion ?? ""),
    tiempoRespuestaMinMinutos:
      row.tiempo_respuesta_min_minutos === null || row.tiempo_respuesta_min_minutos === undefined
        ? null
        : Number(row.tiempo_respuesta_min_minutos),
    tiempoRespuestaMaxMinutos:
      row.tiempo_respuesta_max_minutos === null || row.tiempo_respuesta_max_minutos === undefined
        ? null
        : Number(row.tiempo_respuesta_max_minutos),
    tiempoRespuestaRaw: String(row.tiempo_respuesta_raw ?? ""),
    diagnosticoMinHoras:
      row.diagnostico_min_horas === null || row.diagnostico_min_horas === undefined
        ? null
        : Number(row.diagnostico_min_horas),
    diagnosticoMaxHoras:
      row.diagnostico_max_horas === null || row.diagnostico_max_horas === undefined
        ? null
        : Number(row.diagnostico_max_horas),
    horarioSla: String(row.horario_sla ?? ""),
  };
}

export default function InformesPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sla, setSla] = useState<SlaMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [cliente, setCliente] = useState("");
  const [slaTargetHoras, setSlaTargetHoras] = useState(24);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Supabase no configurado. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setError(null);
    Promise.all([
      supabase.from("tickets").select("*").order("creacion", { ascending: false }),
      supabase.from("tasks").select("*").order("fecha_creacion", { ascending: false }),
      supabase.from("clients").select("*").order("nombre", { ascending: true }),
      supabase.from("sla_matrix").select("*").order("cliente", { ascending: true }),
    ])
      .then(([tix, tsk, cli, sl]) => {
        const anyErr = tix.error || tsk.error || cli.error || sl.error;
        if (anyErr) throw new Error(anyErr.message);

        const ticketsList = (tix.data ?? []).map(rowToTicket);
        setTickets(ticketsList);
        setTasks((tsk.data ?? []).map((r) => rowToTask(r)));
        setClients((cli.data ?? []).map((r) => rowToClient(r)));
        setSla((sl.data ?? []).map((r) => rowToSla(r)));

        const dates = ticketsList.map((t) => parseDate(t.Creación)).filter(Boolean) as Date[];
        if (dates.length > 0) {
          const min = new Date(Math.min(...dates.map((d) => d.getTime())));
          const max = new Date(Math.max(...dates.map((d) => d.getTime())));
          setDesde(toInputDate(min));
          setHasta(toInputDate(max));
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error cargando datos"))
      .finally(() => setLoading(false));
  }, []);

  const clientesList = useMemo(() => {
    const set = new Set(tickets.map((t) => t.Cliente).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tickets]);

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      const d = parseDate(t.Creación);
      if (desde && d) {
        const dd = new Date(desde);
        dd.setHours(0, 0, 0, 0);
        if (d < dd) return false;
      }
      if (hasta && d) {
        const dh = new Date(hasta);
        dh.setHours(23, 59, 59, 999);
        if (d > dh) return false;
      }
      if (cliente && t.Cliente !== cliente) return false;
      return true;
    });
  }, [tickets, desde, hasta, cliente]);

  const abiertos = useMemo(() => ticketsAbiertos(ticketsFiltrados), [ticketsFiltrados]);
  const cerrados = useMemo(() => ticketsCerrados(ticketsFiltrados), [ticketsFiltrados]);
  const slaPct = useMemo(() => cumplimientoSlaPct(ticketsFiltrados, slaTargetHoras), [ticketsFiltrados, slaTargetHoras]);
  const ttrHoras = useMemo(() => ttrPromedioHoras(ticketsFiltrados), [ticketsFiltrados]);
  const vidaAbiertos = useMemo(() => tiempoVidaPromedioAbiertos(ticketsFiltrados), [ticketsFiltrados]);

  const ticketsPorMes = useMemo(() => byMonth(ticketsFiltrados, "Creación"), [ticketsFiltrados]);
  const topClientesAbiertos = useMemo(() => casosAbiertosPorCliente(ticketsFiltrados).slice(0, 10), [ticketsFiltrados]);
  const ticketsPorPrioridad = useMemo(() => sortByCount(groupBy(ticketsFiltrados, "Prioridad")), [ticketsFiltrados]);

  const tasksPendientes = useMemo(() => tasks.filter((t) => t.estado !== "Completada"), [tasks]);
  const tasksPorResponsable = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tasksPendientes) {
      const k = (t.responsable || "(sin responsable)").trim();
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tasksPendientes]);

  const contratosPorVencer = useMemo(() => {
    const now = Date.now();
    const in60 = now + 1000 * 60 * 60 * 24 * 60;
    return clients
      .filter((c) => {
        if (!c.fechaContratoFin) return false;
        const d = new Date(c.fechaContratoFin);
        const t = d.getTime();
        return Number.isFinite(t) && t >= now && t <= in60;
      })
      .sort((a, b) => new Date(a.fechaContratoFin ?? "").getTime() - new Date(b.fechaContratoFin ?? "").getTime())
      .slice(0, 10);
  }, [clients]);

  const slaResumen = useMemo(() => {
    const base = cliente ? sla.filter((s) => s.cliente === cliente) : sla;
    const clientes = new Set(base.map((s) => s.cliente).filter(Boolean)).size;
    const productos = new Set(base.map((s) => s.producto).filter(Boolean)).size;
    const niveles = sortByCount(
      base.reduce<Record<string, number>>((acc, s) => {
        const k = (s.nivelEmergencia || "(sin nivel)").trim();
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {})
    );
    return { total: base.length, clientes, productos, niveles: niveles.slice(0, 6) };
  }, [sla, cliente]);

  const handleDownloadInforme = () => {
    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, rows: unknown[]) => {
      const safe = (rows ?? []).filter(Boolean);
      const ws = XLSX.utils.json_to_sheet(safe as any[]);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet("KPIs Tickets", [
      {
        Cliente: cliente || "Todos",
        Desde: desde || "",
        Hasta: hasta || "",
        "Total tickets": ticketsFiltrados.length,
        Abiertos: abiertos.length,
        Cerrados: cerrados.length,
        "Cumplimiento SLA (%)": slaPct ?? null,
        "SLA objetivo (h)": slaTargetHoras,
        "TTR promedio (h)": ttrHoras,
        "Vida promedio abiertos (días)": vidaAbiertos,
      },
    ]);
    addSheet("Tickets filtrados", ticketsFiltrados);
    addSheet("Tickets por mes", ticketsPorMes);
    addSheet("Tickets por prioridad", ticketsPorPrioridad);
    addSheet("Abiertos por cliente", topClientesAbiertos);

    addSheet("KPIs Tareas", [
      { "Total tareas": tasks.length, Pendientes: tasksPendientes.length, Completadas: tasks.length - tasksPendientes.length },
    ]);
    addSheet("Tareas pendientes", tasksPendientes);
    addSheet("Tareas por responsable", tasksPorResponsable);

    addSheet("Clientes", clients);
    addSheet("Contratos por vencer", contratosPorVencer.map((c) => ({
      Cliente: c.nombre,
      "Contrato fin": c.fechaContratoFin,
      Producto: c.producto,
      Contacto: c.contactoNombre,
      Email: c.contactoEmail,
      Tel: c.contactoTelefono,
    })));

    addSheet("KPIs SLA", [
      {
        Cliente: cliente || "Todos",
        Filas: slaResumen.total,
        Clientes: slaResumen.clientes,
        Productos: slaResumen.productos,
      },
    ]);
    addSheet("SLA (filtrado)", (cliente ? sla.filter((s) => s.cliente === cliente) : sla).map((s) => ({
      Cliente: s.cliente,
      Producto: s.producto,
      Nivel: s.nivelEmergencia,
      Horario: s.horarioSla,
      "Respuesta (raw)": s.tiempoRespuestaRaw,
      "Respuesta min (min)": s.tiempoRespuestaMinMinutos,
      "Respuesta max (min)": s.tiempoRespuestaMaxMinutos,
      "Diag min (h)": s.diagnosticoMinHoras,
      "Diag max (h)": s.diagnosticoMaxHoras,
      Comercial: s.comercial,
      Descripción: s.descripcion,
    })));

    XLSX.writeFile(wb, `informe-general-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
              <div className="flex h-7 w-7 items-center justify-center rounded-md shadow-sm" style={{ backgroundColor: "#05397f" }}>
                <span className="text-white text-sm font-semibold leading-none">//</span>
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Helpdesk</span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#05397f" }}>
            Informes
          </h1>
        </header>

        {!supabase && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-800 dark:text-amber-200 text-sm">
            Supabase no configurado. Configurá las variables de entorno para generar informes.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="min-w-[140px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Cliente</label>
              <select
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="min-w-[220px] rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
              >
                <option value="">Todos</option>
                {clientesList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">SLA objetivo (h)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={slaTargetHoras}
                onChange={(e) => setSlaTargetHoras(Number(e.target.value) || 24)}
                className="w-28 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadInforme}
            disabled={loading}
            className="rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#05397f] disabled:opacity-60"
            style={{ backgroundColor: "#05397f" }}
          >
            Descargar Informe
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Tickets</p>
            <p className="text-2xl font-bold">{ticketsFiltrados.length}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Abiertos: {abiertos.length} · Cerrados: {cerrados.length}</p>
          </div>
          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Cumplimiento SLA</p>
            <p className="text-2xl font-bold">{slaPct ?? "—"}%</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Objetivo: ≤ {slaTargetHoras}h</p>
          </div>
          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Tareas pendientes</p>
            <p className="text-2xl font-bold">{tasksPendientes.length}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Total: {tasks.length}</p>
          </div>
          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Matriz SLA</p>
            <p className="text-2xl font-bold">{slaResumen.total}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Clientes: {slaResumen.clientes} · Productos: {slaResumen.productos}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <h2 className="font-semibold mb-3" style={{ color: "#05397f" }}>Tickets por mes</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ticketsPorMes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={COLORS[0]} name="Tickets" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <h2 className="font-semibold mb-3" style={{ color: "#05397f" }}>Tareas pendientes por responsable (top 10)</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksPorResponsable} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[3]} name="Pendientes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <h2 className="font-semibold mb-3" style={{ color: "#05397f" }}>Tickets por prioridad</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketsPorPrioridad} margin={{ bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" height={50} tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[1]} name="Tickets" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
            <h2 className="font-semibold mb-3" style={{ color: "#05397f" }}>Contratos por vencer (60 días)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-zinc-700 dark:text-zinc-300">
                  <tr>
                    <th className="text-left py-2 px-2 font-medium">Cliente</th>
                    <th className="text-left py-2 px-2 font-medium">Fin</th>
                    <th className="text-left py-2 px-2 font-medium">Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {contratosPorVencer.length === 0 ? (
                    <tr>
                      <td className="py-3 px-2 text-zinc-500 dark:text-zinc-400" colSpan={3}>
                        Sin contratos por vencer en los próximos 60 días.
                      </td>
                    </tr>
                  ) : (
                    contratosPorVencer.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2 px-2">{c.nombre}</td>
                        <td className="py-2 px-2">{c.fechaContratoFin}</td>
                        <td className="py-2 px-2 text-zinc-600 dark:text-zinc-400">{c.contactoNombre || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4">
          <h2 className="font-semibold mb-3" style={{ color: "#05397f" }}>SLA por nivel (distribución)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaResumen.niveles} margin={{ bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={50} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={COLORS[5]} name="Filas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {cliente ? `Filtro aplicado: ${cliente}` : "Sin filtro de cliente"}
          </p>
        </div>
      </div>
    </div>
  );
}

