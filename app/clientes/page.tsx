"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Client } from "@/lib/types";

function formatDate(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
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

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [nombre, setNombre] = useState("");
  const [producto, setProducto] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setError("Supabase no configurado. Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setError(null);
    supabase
      .from("clients")
      .select("*")
      .order("nombre", { ascending: true })
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) {
          setError(err.message);
          return;
        }
        setClients((data ?? []).map((row) => rowToClient(row)));
      });
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setNombre("");
    setProducto("");
    setFechaInicio("");
    setFechaFin("");
    setContactoNombre("");
    setContactoEmail("");
    setContactoTelefono("");
    setNotas("");
  };

  const fillForm = (c: Client) => {
    setEditingId(c.id);
    setNombre(c.nombre);
    setProducto(c.producto);
    setFechaInicio(c.fechaContratoInicio ? c.fechaContratoInicio.slice(0, 10) : "");
    setFechaFin(c.fechaContratoFin ? c.fechaContratoFin.slice(0, 10) : "");
    setContactoNombre(c.contactoNombre);
    setContactoEmail(c.contactoEmail);
    setContactoTelefono(c.contactoTelefono);
    setNotas(c.notas);
  };

  const guardar = async () => {
    if (!supabase) return;
    if (!nombre.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      nombre: nombre.trim(),
      producto: producto.trim(),
      fecha_contrato_inicio: fechaInicio || null,
      fecha_contrato_fin: fechaFin || null,
      contacto_nombre: contactoNombre.trim(),
      contacto_email: contactoEmail.trim(),
      contacto_telefono: contactoTelefono.trim(),
      notas: notas.trim(),
    };

    if (editingId) {
      const { data, error: err } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingId)
        .select("*")
        .single();
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data) {
        setClients((prev) => prev.map((c) => (c.id === editingId ? rowToClient(data) : c)));
        resetForm();
      }
    } else {
      const { data, error: err } = await supabase.from("clients").insert(payload).select("*").single();
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data) {
        setClients((prev) => [rowToClient(data), ...prev].sort((a, b) => a.nombre.localeCompare(b.nombre)));
        resetForm();
      }
    }
  };

  const eliminar = async (id: number) => {
    if (!supabase) return;
    if (!confirm("¿Eliminar este cliente?")) return;
    const { error: err } = await supabase.from("clients").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
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
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "#05397f" }}>
            Gestión de Clientes
          </h1>
        </header>

        {!supabase && (
          <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-800 dark:text-amber-200 text-sm">
            Supabase no configurado. Configurá las variables de entorno para guardar y leer clientes.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 items-start">
          <section className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {editingId ? "Editar cliente" : "Nuevo cliente"}
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Nombre (ej. Banco), producto, fechas de contrato y persona de contacto.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre del cliente (Banco) *
                </label>
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  placeholder="Ej: Banco Santa Cruz"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Producto
                </label>
                <input
                  value={producto}
                  onChange={(e) => setProducto(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  placeholder="Ej: Core Bancario, Portal"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Contrato inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Contrato fin
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Persona de contacto *
                </label>
                <input
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email de contacto
                </label>
                <input
                  type="email"
                  value={contactoEmail}
                  onChange={(e) => setContactoEmail(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  placeholder="contacto@banco.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  placeholder="+54 11 ..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Notas
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#05397f] focus:border-transparent"
                  placeholder="Observaciones o datos extra (espacio para ampliar después)"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={guardar}
                disabled={saving || !supabase}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#05397f] disabled:opacity-60"
                style={{ backgroundColor: "#05397f" }}
              >
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Agregar cliente"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </section>

          <section className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Clientes ({clients.length})
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Ordenados por nombre. Podés editar o eliminar desde cada tarjeta.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10 text-zinc-500 dark:text-zinc-400 text-sm">
                Cargando clientes…
              </div>
            ) : clients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-950/40 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No hay clientes cargados. Agregá el primero con el formulario.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={c.nombre}>
                          {c.nombre}
                        </p>
                        {c.producto && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                            Producto: {c.producto}
                          </p>
                        )}
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                          Contrato: {formatDate(c.fechaContratoInicio)} → {formatDate(c.fechaContratoFin)}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                          Contacto: {c.contactoNombre || "—"}
                          {c.contactoEmail && ` · ${c.contactoEmail}`}
                          {c.contactoTelefono && ` · ${c.contactoTelefono}`}
                        </p>
                        {c.notas && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 line-clamp-2" title={c.notas}>
                            {c.notas}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => fillForm(c)}
                          className="text-xs font-medium text-[#05397f] hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminar(c.id)}
                          className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                        >
                          Eliminar
                        </button>
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
