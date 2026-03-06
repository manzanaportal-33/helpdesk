export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-sky-50/40 to-zinc-100 dark:from-zinc-950 dark:via-sky-950/20 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-white/80 dark:bg-zinc-900/80 px-3 py-1 border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md shadow-sm"
              style={{ backgroundColor: "#05397f" }}
            >
              <span className="text-white text-sm font-semibold leading-none">//</span>
            </div>
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 tracking-wide">
              Helpdesk
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#05397f" }}>
              Gestión de Mesa de Ayuda
            </h1>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 max-w-xl mx-auto">
              Panel Centralizado de la Mesa de Ayuda
            </p>
          </div>
        </header>

        <section className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Módulos de Gestión
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#05397f" }} />
              Ecosistema en crecimiento
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <a
              href="/analisis"
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Análisis de Tickets
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Dashboard de Mesa de Ayuda
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir al análisis de tickets
              </span>
            </a>

            <a
              href="/tablero"
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Seguimiento de incidencias
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tablero de incidencias
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir al tablero de incidencias
              </span>
            </a>

            <a
              href="/tareas"
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Gestión de tareas pendientes
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tareas internas de la mesa
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir a Gestión de Tareas
              </span>
            </a>

            <a
              href="/clientes"
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Gestión de Clientes
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Clientes
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir a Gestión de Clientes
              </span>
            </a>

            <a
              href="/sla"
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Matriz SLA
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  SLA
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir a Matriz SLA
              </span>
            </a>

            <a
              href="/informes"
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Informes
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Reportes y métricas
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir a Informes
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
