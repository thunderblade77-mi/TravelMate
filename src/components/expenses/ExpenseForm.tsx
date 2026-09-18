import { useEffect, useMemo, useState } from 'react'

import { useTripMembers } from '../../hooks/useTripMembers'
import {
  EXPENSE_CATEGORY_OPTIONS,
  EXPENSE_PAYMENT_METHOD_OPTIONS,
  type Expense,
  type ExpenseSplitKind,
} from '../../types/expense'

type FormValues = {
  title: string
  merchant: string
  amount: string
  category: Expense['category']
  date: string
  paidBy: string
  paymentMethod: Expense['paymentMethod']
  splitKind: ExpenseSplitKind
  splitWith: string[]
  familyNames: string
  notes: string
}

type Props = {
  tripId?: string
  initialExpense?: Expense | null
  onSubmit: (values: {
    title: string
    merchant: string
    amount: number
    category: Expense['category']
    date: string
    paidBy: string
    paymentMethod: Expense['paymentMethod']
    splitKind: ExpenseSplitKind
    splitWith: string[]
    notes: string
  }) => void
  onCancel: () => void
}

function today() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ExpenseForm({ tripId, initialExpense, onSubmit, onCancel }: Props) {
  const members = useTripMembers(tripId)
  const families = useMemo(
    () => Array.from(new Set(members.map((member) => member.familyName).filter((name): name is string => Boolean(name)))),
    [members],
  )
  const [values, setValues] = useState<FormValues>({
    title: '', merchant: '', amount: '', category: 'restaurant', date: today(),
    paidBy: '', paymentMethod: 'card', splitKind: 'none', splitWith: [], familyNames: '', notes: '',
  })

  useEffect(() => {
    if (!initialExpense) return
    setValues({
      title: initialExpense.title,
      merchant: initialExpense.merchant,
      amount: String(initialExpense.amount),
      category: initialExpense.category,
      date: initialExpense.date,
      paidBy: initialExpense.paidBy,
      paymentMethod: initialExpense.paymentMethod,
      splitKind: initialExpense.splitKind,
      splitWith: initialExpense.splitWith,
      familyNames: initialExpense.splitKind === 'families' ? initialExpense.splitWith.join(', ') : '',
      notes: initialExpense.notes,
    })
  }, [initialExpense])

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function toggleMember(name: string) {
    update(
      'splitWith',
      values.splitWith.includes(name)
        ? values.splitWith.filter((item) => item !== name)
        : [...values.splitWith, name],
    )
  }

  function toggleFamily(name: string) {
    const current = values.familyNames.split(',').map((item) => item.trim()).filter(Boolean)
    const next = current.includes(name)
      ? current.filter((item) => item !== name)
      : [...current, name]
    update('familyNames', next.join(', '))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const amount = Number(values.amount)
    if (!values.title.trim() || !Number.isFinite(amount) || amount <= 0) return

    const splitWith = values.splitKind === 'none'
      ? []
      : values.splitKind === 'families'
        ? values.familyNames.split(',').map((item) => item.trim()).filter(Boolean)
        : values.splitWith

    onSubmit({
      title: values.title.trim(), merchant: values.merchant.trim(), amount,
      category: values.category, date: values.date, paidBy: values.paidBy.trim(),
      paymentMethod: values.paymentMethod, splitKind: values.splitKind, splitWith,
      notes: values.notes.trim(),
    })
  }

  const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50'
  const selectedFamilies = values.familyNames.split(',').map((item) => item.trim()).filter(Boolean)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Descrizione</label>
        <input value={values.title} onChange={(e) => update('title', e.target.value)} className={fieldClass} placeholder="Es. Cena di pesce" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Dove hai speso</label>
        <input value={values.merchant} onChange={(e) => update('merchant', e.target.value)} className={fieldClass} placeholder="Es. Restaurante O Pescador, Lisbona" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Importo</label>
          <input type="number" step="0.01" min="0" value={values.amount} onChange={(e) => update('amount', e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Data</label>
          <input type="date" value={values.date} onChange={(e) => update('date', e.target.value)} className={fieldClass} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Categoria</label>
        <select value={values.category} onChange={(e) => update('category', e.target.value as Expense['category'])} className={fieldClass}>
          {EXPENSE_CATEGORY_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.icon} {item.label}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Pagato da</label>
        {members.length > 0 ? (
          <select value={values.paidBy} onChange={(e) => update('paidBy', e.target.value)} className={fieldClass}>
            <option value="">Seleziona partecipante</option>
            {members.map((member) => <option key={member.id} value={member.name}>{member.name}{member.familyName ? ` · ${member.familyName}` : ''}{member.role === 'owner' ? ' · organizzatore' : ''}</option>)}
          </select>
        ) : (
          <input value={values.paidBy} onChange={(e) => update('paidBy', e.target.value)} className={fieldClass} placeholder="Nome di chi ha pagato" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Divisione</label>
          <select value={values.splitKind} onChange={(e) => update('splitKind', e.target.value as ExpenseSplitKind)} className={fieldClass}>
            <option value="none">Non dividere</option>
            <option value="participants">Per partecipanti</option>
            <option value="families">Per famiglie</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Metodo</label>
          <select value={values.paymentMethod} onChange={(e) => update('paymentMethod', e.target.value as Expense['paymentMethod'])} className={fieldClass}>
            {EXPENSE_PAYMENT_METHOD_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
      </div>

      {values.splitKind === 'participants' && (
        <div>
          <label className="mb-2 block text-sm font-medium">Dividi tra partecipanti</label>
          {members.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {members.map((member) => {
                const selected = values.splitWith.includes(member.name)
                return (
                  <button key={member.id} type="button" onClick={() => toggleMember(member.name)} className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <span className="mr-2">{selected ? '✓' : '○'}</span>{member.name}
                    {member.familyName && <span className="mt-1 block text-[11px] font-medium opacity-70">{member.familyName}</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-700">Invita prima i partecipanti al viaggio: compariranno automaticamente qui.</p>
          )}
          <p className="mt-2 text-xs text-slate-500">La quota viene divisa in parti uguali tra le persone selezionate.</p>
        </div>
      )}

      {values.splitKind === 'families' && (
        <div>
          <label className="mb-2 block text-sm font-medium">Dividi tra famiglie</label>
          {families.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {families.map((family) => {
                const selected = selectedFamilies.includes(family)
                const familyMembers = members.filter((member) => member.familyName === family).length
                return (
                  <button key={family} type="button" onClick={() => toggleFamily(family)} className={`rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition ${selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <span className="mr-2">{selected ? '✓' : '○'}</span>{family}
                    <span className="mt-1 block text-[11px] font-medium opacity-70">{familyMembers} {familyMembers === 1 ? 'persona' : 'persone'}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <input value={values.familyNames} onChange={(e) => update('familyNames', e.target.value)} className={fieldClass} placeholder="Famiglia Rossi, Famiglia Bianchi" />
              <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">Nessun nucleo è ancora assegnato ai partecipanti. Puoi comunque inserire i nomi manualmente.</p>
            </>
          )}
          <p className="mt-2 text-xs text-slate-500">La quota viene divisa in parti uguali tra i nuclei selezionati.</p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Note</label>
        <textarea rows={3} value={values.notes} onChange={(e) => update('notes', e.target.value)} className={fieldClass} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-5 py-2">Annulla</button>
        <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white">{initialExpense ? 'Salva modifiche' : 'Aggiungi spesa'}</button>
      </div>
    </form>
  )
}
