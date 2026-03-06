"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Task } from "@/lib/types";

const ESTADOS_TAREA = ["Pendiente", "En curso", "Bloqueada", "Completada"] as const;
const PRIORIDADES_TAREA = ["Baja", "Media", "Alta", "Urgente"] as const;

type EstadoTarea = (typeof ESTADOS_TAREA)[number];
type PrioridadTarea = (typeof PRIORIDADES_TAREA)[number];

function formatDateShort(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

export default function TareasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<"pendientes" | "todas">("pendientes");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [responsable, setResponsable] = useState("");
  const [prioridad, setPrioridad] = useState<PrioridadTarea>("Media");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Supabase no configurado. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setError(null);
    supabase
      .from("tasks")
      .select("*")
      .order("fecha_creacion", { ascending: false })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        const list: Task[] =
          data?.map((row: any) => ({
            id: row.id,
            titulo: row.titulo ?? "",
            descripcion: row.descripcion ?? "",
            responsable: row.responsable ?? "",
            prioridad: row.prioridad ?? "",
            estado: row.estado ?? "Pendiente",
            fechaCreacion: row.fecha_creacion ?? "",
            fechaVencimiento: row.fecha_vencimiento ?? null,
          })) ?? [];
        setTasks(list);
      });
  }, []);

  const visibles = useMemo(() => {
    let base = tasks;
    if (filtroEstado === "pendientes") {
      base = tasks.filter((t) => t.estado !== "Completada");
    }
    return base.sort((a, b) => {
      const da = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
      const db = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
      return da - db;
    });
  }, [tasks, filtroEstado]);

  const pendientesCount = useMemo(
    () => tasks.filter((t) => t.estado !== "Completada").length,
    [tasks]
  );

  const crearTarea = async () => {
    if (!supabase) return;
    if (!titulo.trim() || !responsable.trim()) {
      setError("Título y Responsable son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("tasks")
      .insert({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        responsable: responsable.trim(),
        prioridad,
        estado: "Pendiente",
        fecha_vencimiento: fechaVencimiento || null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      const nueva: Task = {
        id: data.id,
        titulo: data.titulo ?? "",
        descripcion: data.descripcion ?? "",
        responsable: data.responsable ?? "",
        prioridad: data.prioridad ?? "",
        estado: data.estado ?? "Pendiente",
        fechaCreacion: data.fecha_creacion ?? "",
        fechaVencimiento: data.fecha_vencimiento ?? null,
      };
      setTasks((prev) => [nueva, ...prev]);
      setTitulo("");
      setDescripcion("");
      setResponsable("");
      setPrioridad("Media");
      setFechaVencimiento("");
    }
  };

  const actualizarEstado = async (taskId: number, nuevoEstado: EstadoTarea) => {
    if (!supabase) return;
    setUpdatingId(taskId);
    const { error: err } = await supabase.from("tasks").update({ estado: nuevoEstado }).eq("id", taskId);
    setUpdatingId(null);
    if (err) {
      console.error("Error al actualizar tarea:", err);
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, estado: nuevoEstado } : t)));
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
              <div
                className="flex h-7 w-7 items-center justify-center rounded-md shadow-sm"
                style={{ backgroundColor: "#05397f" }}
              >
                <span className="text-white text-sm font-semibold leading-none">//</span>
              </div>
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Helpdesk</span>
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-right" style={{ color: "#05397f" }}>
            Gestión de Tareas pendientes
          </h1>
        </header>

        {!supabase && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-800 dark:text-amber-200 text-sm">
            Supabase no configurado. Configurá las variables de entorno para guardar y leer tareas desde la base de datos.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)] gap-6 items-start">
          <section className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Nueva tarea
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Cargá tareas internas de la mesa: pendientes por revisar, mejoras, tareas recurrentes, etc.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Título *
                </label>
                <input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Revisar SLA de Banco Santa Cruz"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detalles, pasos a seguir o contexto de la tarea."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Responsable *
                </label>
                <input
                  value={responsable}
                  onChange={(e) => setResponsable(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Parodis Agustin"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as PrioridadTarea)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PRIORIDADES_TAREA.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Fecha de vencimiento
                  </label>
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={crearTarea}
              disabled={saving || !supabase}
              className="mt-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#05397f] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#05397f" }}
            >
              {saving ? "Guardando..." : "Agregar tarea pendiente"}
            </button>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
              <span>
                Tareas totales: <strong>{tasks.length}</strong>
              </span>
              <span>
                Pendientes: <strong>{pendientesCount}</strong>
              </span>
            </div>
          </section>

          <section className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tareas {filtroEstado === "pendientes" ? "pendientes" : "todas"}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Ordenadas por fecha de vencimiento (primero las más urgentes).
                </p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFiltroEstado("pendientes")}
                  className={`px-2 py-0.5 rounded-full ${
                    filtroEstado === "pendientes"
                      ? "bg-[#05397f] text-white"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado("todas")}
                  className={`px-2 py-0.5 rounded-full ${
                    filtroEstado === "todas"
                      ? "bg-[#05397f] text-white"
                      : "text-zinc-600 dark:text-zinc-300"
                  }`}
                >
                  Todas
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">
                Cargando tareas…
              </div>
            ) : visibles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-950/40 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay tareas {filtroEstado === "pendientes" ? "pendientes" : "registradas"}.
              </div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {visibles.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2" title={t.titulo}>
                          {t.titulo}
                        </p>
                        {t.descripcion && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2" title={t.descripcion}>
                            {t.descripcion}
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Responsable: <span className="font-medium">{t.responsable || "—"}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 text-[11px]">
                        <select
                          value={t.estado}
                          onChange={(e) => actualizarEstado(t.id, e.target.value as EstadoTarea)}
                          disabled={updatingId === t.id}
                          className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 text-[11px] min-w-[110px]"
                        >
                          {ESTADOS_TAREA.map((est) => (
                            <option key={est} value={est}>
                              {est}
                            </option>
                          ))}
                        </select>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            t.prioridad === "Urgente"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                              : t.prioridad === "Alta"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {t.prioridad || "Sin prioridad"}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          Vence: {formatDateShort(t.fechaVencimiento)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

