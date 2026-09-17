import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

import type {
  Expense,
  ExpenseCategory,
} from '../types/expense'

type ExpenseInput = Omit<
  Expense,
  'id' | 'createdAt' | 'updatedAt'
>

type ExpenseUpdate = Partial<
  Omit<
    Expense,
    'id' | 'tripId' | 'createdAt' | 'updatedAt'
  >
>

type CategoryTotal = {
  category: ExpenseCategory
  total: number
  percentage: number
}

type CloudExpenseRow = {
  id: string
  trip_id: string
  created_by: string
  title: string
  merchant: string | null
  amount: number | string
  category: ExpenseCategory
  expense_date: string
  paid_by: string
  payment_method: Expense['paymentMethod']
  split_kind: Expense['splitKind'] | null
  split_with: unknown
  notes: string
  created_at: string
  updated_at: string
}

function createId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function normalizeSplitWith(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapCloudExpense(
  row: CloudExpenseRow,
): Expense {
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    merchant: row.merchant ?? '',
    amount: Math.max(
      0,
      Number(row.amount) || 0,
    ),
    category: row.category,
    date: row.expense_date,
    paidBy: row.paid_by,
    paymentMethod: row.payment_method,
    splitKind: row.split_kind ?? 'none',
    splitWith: normalizeSplitWith(row.split_with),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useExpenses(
  tripId?: string,
  budget = 0,
) {
  const [expenses, setExpenses] =
    useState<Expense[]>([])

  const [userId, setUserId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(Boolean(tripId))

  const [error, setError] =
    useState<string | null>(null)

  const reloadExpenses =
    useCallback(async () => {
      if (!tripId) {
        setExpenses([])
        setLoading(false)
        setError(null)
        return
      }

      setLoading(true)

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        if (!user) {
          setUserId(null)
          setExpenses([])
          setError(
            'Devi effettuare il login.',
          )
          return
        }

        setUserId(user.id)

        const {
          data,
          error: expensesError,
        } = await supabase
          .from('expenses')
          .select(
            `
              id,
              trip_id,
              created_by,
              title,
              merchant,
              amount,
              category,
              expense_date,
              payment_method,
              paid_by,
              split_kind,
              split_with,
              notes,
              created_at,
              updated_at
            `,
          )
          .eq('trip_id', tripId)
          .order('expense_date', {
            ascending: false,
          })
          .order('created_at', {
            ascending: false,
          })

        if (expensesError) {
          throw expensesError
        }

        setExpenses(
          (data ?? []).map((row) =>
            mapCloudExpense(
              row as CloudExpenseRow,
            ),
          ),
        )

        setError(null)
      } catch (loadError) {
        console.error(
          'Errore caricamento spese:',
          loadError,
        )

        setExpenses([])
        setError(
          'Impossibile caricare le spese.',
        )
      } finally {
        setLoading(false)
      }
    }, [tripId])

  useEffect(() => {
    void reloadExpenses()
  }, [reloadExpenses])

  useEffect(() => {
    if (!tripId) {
      return
    }

    const channel = supabase
      .channel(
        `travelg-expenses-${tripId}`,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          void reloadExpenses()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tripId, reloadExpenses])

  const sortedExpenses = useMemo(
    () =>
      [...expenses].sort(
        (firstExpense, secondExpense) => {
          const dateComparison =
            secondExpense.date.localeCompare(
              firstExpense.date,
            )

          if (dateComparison !== 0) {
            return dateComparison
          }

          return secondExpense.createdAt.localeCompare(
            firstExpense.createdAt,
          )
        },
      ),
    [expenses],
  )

  const addExpense = useCallback(
    (input: ExpenseInput): Expense => {
      if (!userId) {
        throw new Error(
          'Utente non autenticato.',
        )
      }

      const now = new Date().toISOString()

      const newExpense: Expense = {
        ...input,
        id: createId(),
        amount: Math.max(0, input.amount),
        title: input.title.trim(),
        merchant: input.merchant.trim(),
        paidBy: input.paidBy.trim(),
        splitWith: input.splitWith
          .map((item) => item.trim())
          .filter(Boolean),
        notes: input.notes.trim(),
        createdAt: now,
        updatedAt: now,
      }

      setExpenses((currentExpenses) => [
        newExpense,
        ...currentExpenses,
      ])

      void supabase
        .from('expenses')
        .insert({
          id: newExpense.id,
          trip_id: newExpense.tripId,
          created_by: userId,
          title: newExpense.title,
          merchant: newExpense.merchant,
          amount: newExpense.amount,
          category: newExpense.category,
          expense_date: newExpense.date,
          payment_method: newExpense.paymentMethod,
          paid_by: newExpense.paidBy,
          split_kind: newExpense.splitKind,
          split_with: newExpense.splitWith,
          notes: newExpense.notes,
          created_at: newExpense.createdAt,
          updated_at: newExpense.updatedAt,
        })
        .then(({ error: insertError }) => {
          if (!insertError) {
            setError(null)
            return
          }

          console.error(
            'Errore aggiunta spesa:',
            insertError,
          )

          setExpenses((currentExpenses) =>
            currentExpenses.filter(
              (expense) =>
                expense.id !== newExpense.id,
            ),
          )

          setError(
            'Impossibile aggiungere la spesa.',
          )
        })

      return newExpense
    },
    [userId],
  )

  const updateExpense = useCallback(
    (
      expenseId: string,
      updates: ExpenseUpdate,
    ): Expense | null => {
      const currentExpense =
        expenses.find(
          (expense) =>
            expense.id === expenseId,
        )

      if (!currentExpense) {
        return null
      }

      const updatedExpense: Expense = {
        ...currentExpense,
        ...updates,
        title:
          updates.title !== undefined
            ? updates.title.trim()
            : currentExpense.title,
        merchant:
          updates.merchant !== undefined
            ? updates.merchant.trim()
            : currentExpense.merchant,
        amount:
          updates.amount !== undefined
            ? Math.max(0, updates.amount)
            : currentExpense.amount,
        paidBy:
          updates.paidBy !== undefined
            ? updates.paidBy.trim()
            : currentExpense.paidBy,
        splitWith:
          updates.splitWith !== undefined
            ? updates.splitWith
                .map((item) => item.trim())
                .filter(Boolean)
            : currentExpense.splitWith,
        notes:
          updates.notes !== undefined
            ? updates.notes.trim()
            : currentExpense.notes,
        updatedAt: new Date().toISOString(),
      }

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === expenseId
            ? updatedExpense
            : expense,
        ),
      )

      void supabase
        .from('expenses')
        .update({
          title: updatedExpense.title,
          merchant: updatedExpense.merchant,
          amount: updatedExpense.amount,
          category: updatedExpense.category,
          expense_date: updatedExpense.date,
          payment_method: updatedExpense.paymentMethod,
          paid_by: updatedExpense.paidBy,
          split_kind: updatedExpense.splitKind,
          split_with: updatedExpense.splitWith,
          notes: updatedExpense.notes,
          updated_at:
            updatedExpense.updatedAt,
        })
        .eq('id', expenseId)
        .then(({ error: updateError }) => {
          if (!updateError) {
            setError(null)
            return
          }

          console.error(
            'Errore aggiornamento spesa:',
            updateError,
          )

          setExpenses((currentExpenses) =>
            currentExpenses.map((expense) =>
              expense.id === expenseId
                ? currentExpense
                : expense,
            ),
          )

          setError(
            'Impossibile aggiornare la spesa.',
          )
        })

      return updatedExpense
    },
    [expenses],
  )

  const deleteExpense = useCallback(
    (expenseId: string): void => {
      const deletedExpense =
        expenses.find(
          (expense) =>
            expense.id === expenseId,
        )

      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) =>
            expense.id !== expenseId,
        ),
      )

      void supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .then(({ error: deleteError }) => {
          if (!deleteError) {
            setError(null)
            return
          }

          console.error(
            'Errore eliminazione spesa:',
            deleteError,
          )

          if (deletedExpense) {
            setExpenses(
              (currentExpenses) => [
                ...currentExpenses,
                deletedExpense,
              ],
            )
          }

          setError(
            'Impossibile eliminare la spesa.',
          )
        })
    },
    [expenses],
  )

  const deleteExpensesByTrip =
    useCallback(
      (targetTripId: string): void => {
        const previousExpenses = expenses

        setExpenses((currentExpenses) =>
          currentExpenses.filter(
            (expense) =>
              expense.tripId !==
              targetTripId,
          ),
        )

        void supabase
          .from('expenses')
          .delete()
          .eq('trip_id', targetTripId)
          .then(
            ({
              error: deleteError,
            }) => {
              if (!deleteError) {
                setError(null)
                return
              }

              console.error(
                'Errore eliminazione spese viaggio:',
                deleteError,
              )

              setExpenses(previousExpenses)

              setError(
                'Impossibile eliminare le spese del viaggio.',
              )
            },
          )
      },
      [expenses],
    )

  const getExpenseById = useCallback(
    (
      expenseId: string,
    ): Expense | undefined =>
      expenses.find(
        (expense) =>
          expense.id === expenseId,
      ),
    [expenses],
  )

  const totalSpent = useMemo(
    () =>
      sortedExpenses.reduce(
        (total, expense) =>
          total + expense.amount,
        0,
      ),
    [sortedExpenses],
  )

  const remainingBudget = useMemo(
    () => budget - totalSpent,
    [budget, totalSpent],
  )

  const budgetUsedPercentage =
    useMemo(() => {
      if (budget <= 0) {
        return 0
      }

      return Math.max(
        0,
        Math.round(
          (totalSpent / budget) * 100,
        ),
      )
    }, [budget, totalSpent])

  const categoryTotals = useMemo<
    CategoryTotal[]
  >(() => {
    const totals = new Map<
      ExpenseCategory,
      number
    >()

    sortedExpenses.forEach((expense) => {
      const currentTotal =
        totals.get(expense.category) ?? 0

      totals.set(
        expense.category,
        currentTotal + expense.amount,
      )
    })

    return Array.from(
      totals.entries(),
    )
      .map(([category, total]) => ({
        category,
        total,
        percentage:
          totalSpent > 0
            ? Math.round(
                (total / totalSpent) *
                  100,
              )
            : 0,
      }))
      .sort(
        (
          firstCategory,
          secondCategory,
        ) =>
          secondCategory.total -
          firstCategory.total,
      )
  }, [sortedExpenses, totalSpent])

  const paidByTotals = useMemo(() => {
    const totals = new Map<
      string,
      number
    >()

    sortedExpenses.forEach((expense) => {
      const paidBy =
        expense.paidBy.trim() ||
        'Non specificato'

      totals.set(
        paidBy,
        (totals.get(paidBy) ?? 0) +
          expense.amount,
      )
    })

    return Array.from(
      totals.entries(),
    )
      .map(([paidBy, total]) => ({
        paidBy,
        total,
      }))
      .sort(
        (
          firstPerson,
          secondPerson,
        ) =>
          secondPerson.total -
          firstPerson.total,
      )
  }, [sortedExpenses])

  const merchantTotals = useMemo(() => {
    const totals = new Map<string, number>()

    sortedExpenses.forEach((expense) => {
      const merchant = expense.merchant.trim()

      if (!merchant) {
        return
      }

      totals.set(
        merchant,
        (totals.get(merchant) ?? 0) + expense.amount,
      )
    })

    return Array.from(totals.entries())
      .map(([merchant, total]) => ({ merchant, total }))
      .sort((a, b) => b.total - a.total)
  }, [sortedExpenses])

  const settlementTotals = useMemo(() => {
    const balances = new Map<string, number>()

    sortedExpenses.forEach((expense) => {
      const members = Array.from(
        new Set(expense.splitWith.map((item) => item.trim()).filter(Boolean)),
      )

      if (
        expense.splitKind === 'none' ||
        members.length === 0
      ) {
        return
      }

      const share = expense.amount / members.length

      members.forEach((member) => {
        balances.set(
          member,
          (balances.get(member) ?? 0) - share,
        )
      })

      const payer = expense.paidBy.trim()

      if (payer) {
        balances.set(
          payer,
          (balances.get(payer) ?? 0) + expense.amount,
        )
      }
    })

    return Array.from(balances.entries())
      .map(([name, balance]) => ({
        name,
        balance: Math.round(balance * 100) / 100,
      }))
      .filter((item) => Math.abs(item.balance) >= 0.01)
      .sort((a, b) => b.balance - a.balance)
  }, [sortedExpenses])

  return {
    expenses: sortedExpenses,
    expenseCount:
      sortedExpenses.length,
    totalSpent,
    remainingBudget,
    budgetUsedPercentage,
    categoryTotals,
    paidByTotals,
    merchantTotals,
    settlementTotals,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpensesByTrip,
    getExpenseById,
    reloadExpenses,
  }
}