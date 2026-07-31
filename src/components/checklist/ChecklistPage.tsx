import { useState, type FormEvent } from 'react'

import { useChecklist } from '../../hooks/useChecklist'
import type { Trip } from '../../types/travel'

type ChecklistPageProps = {
  activeTrip: Trip | null
}

export default function ChecklistPage({
  activeTrip,
}: ChecklistPageProps) {
  const [label, setLabel] = useState('')

  const {
    items,
    progress,
    completedCount,
    totalCount,
    addItem,
    toggleItem,
    deleteItem,
    clearCompleted,
    addDefaultItems,
  } = useChecklist(activeTrip?.id)

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!activeTrip || !label.trim()) {
      return
    }

    addItem({
      tripId: activeTrip.id,
      label,
    })

    setLabel('')
  }

  if (!activeTrip) {
    return (
      <section>
        <h1 className="text-3xl font-bold">
          Checklist
        </h1>

        <p className="mt-4 text-slate-500">
          Seleziona un viaggio per usare la checklist.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-3xl font-bold">
        Checklist
      </h1>

      <p className="mt-2 text-slate-500">
        {activeTrip.destination}
      </p>

      <div className="mt-6 rounded-3xl bg-blue-600 p-5 text-white">
        <p className="text-sm">
          Completamento
        </p>

        <p className="mt-2 text-3xl font-bold">
          {progress}%
        </p>

        <p className="mt-2 text-sm">
          {completedCount} di {totalCount}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex gap-2"
      >
        <input
          value={label}
          onChange={(e) =>
            setLabel(e.target.value)
          }
          placeholder="Nuovo elemento"
          className="flex-1 rounded-xl border p-3"
        />

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 text-white"
        >
          +
        </button>
      </form>

      {items.length === 0 ? (
        <div className="mt-6">
          <button
            onClick={addDefaultItems}
            className="rounded-xl bg-slate-900 px-5 py-3 text-white"
          >
            Aggiungi checklist base
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border bg-white p-4"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() =>
                    toggleItem(item.id)
                  }
                />

                <span
                  className={`flex-1 ${
                    item.completed
                      ? 'line-through text-slate-400'
                      : ''
                  }`}
                >
                  {item.label}
                </span>

                <button
                  onClick={() =>
                    deleteItem(item.id)
                  }
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          {completedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="mt-6 w-full rounded-xl border py-3"
            >
              Elimina completati
            </button>
          )}
        </>
      )}
    </section>
  )
}