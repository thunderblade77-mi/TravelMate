export default function MapPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold tracking-tight">
        Mappa
      </h1>

      <p className="mt-2 text-slate-500">
        Qui visualizzeremo il percorso del viaggio.
      </p>

      <div className="mt-7 flex min-h-96 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="text-center">
          <span className="text-5xl">🗺️</span>

          <h2 className="mt-4 font-bold">
            Mappa Live
          </h2>

          <p className="mt-2 max-w-56 text-sm text-slate-500">
            La mappa verrà collegata al viaggio attivo.
          </p>
        </div>
      </div>
    </section>
  )
}