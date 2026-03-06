export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-sky-50/40 to-zinc-100 dark:from-zinc-950 dark:via-sky-950/20 dark:to-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-md shadow-sm"
              style={{ backgroundColor: "#05397f" }}
            >
              <span className="text-white text-base font-semibold leading-none">//</span>
            </div>
            <span className="text-base font-semibold text-zinc-700 dark:text-zinc-200">
              Helpdesk
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#05397f" }}>
              Gestión de Mesa de Ayuda
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
              Panel centralizado para analizar tickets, monitorear SLA y agregar futuras herramientas de
              gestión para tu mesa de ayuda.
            </p>
          </div>
        </header>

        <section className="bg-[#f8f9fa] dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Módulos disponibles
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Elegí qué querés gestionar hoy. Podés sumar más módulos a medida que el sistema crezca.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/analisis"
              className="group flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-md transition-colors"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Análisis de Tickets
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Dashboard de Mesa de Ayuda
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Cargá un Excel de tickets, filtrá por cliente, prioridad y estado, y obtené métricas de SLA,
                  tendencias y reportes descargables.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir al análisis de tickets
              </span>
            </a>

            <a
              href="/tablero"
              className="group flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-md transition-colors"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Seguimiento de incidencias
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tablero de incidencias
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Vista tipo Kanban por estado: Pendiente, En Curso, Resuelto, etc. Mové los tickets
                  de columna y actualizá el estado en la base de datos.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir al tablero de incidencias
              </span>
            </a>

            <a
              href="/tareas"
              className="group flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-md transition-colors"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Gestión de tareas pendientes
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Tareas internas de la mesa
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Registrá tareas pendientes, asigná responsables y prioridad, definí fechas de vencimiento
                  y marcá como completadas cuando se resuelvan.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir a Gestión de Tareas
              </span>
            </a>

            <a
              href="/clientes"
              className="group flex flex-col justify-between rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 p-4 hover:border-[#05397f] hover:shadow-md transition-colors"
            >
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#05397f]">
                  Gestión de Clientes
                </p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Bancos y contactos
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Nombre del cliente (Banco), producto, fechas de contrato inicio–fin y persona de contacto.
                  Espacio para ampliar datos después.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-[#05397f] group-hover:underline">
                Ir a Gestión de Clientes
              </span>
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
