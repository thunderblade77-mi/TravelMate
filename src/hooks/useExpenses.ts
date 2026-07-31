import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import type {
  Expense,
  ExpenseCategory,
} from '../types/expense'

const STORAGE_KEY = 'travelmate-expenses'
const EXPENSES_UPDATED_EVENT =
  'travelmate-expenses-updated'

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

function readExpenses(): Expense[] {
  try {
    const storedExpenses =
      localStorage.getItem(STORAGE_KEY)

    if (!storedExpenses) {
      return []
    }

    const parsedExpenses: unknown =
      JSON.parse(storedExpenses)

    if (!Array.isArray(parsedExpenses)) {
      return []
    }

    return parsedExpenses.filter(
      (expense): expense is Expense =>
        typeof expense === 'object' &&
        expense !== null &&
        typeof expense.id === 'string' &&
        typeof expense.tripId === 'string' &&
        typeof expense.title === 'string' &&
        typeof expense.amount === 'number' &&
        Number.isFinite(expense.amount),
    )
  } catch {
    return []
  }
}

function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(expenses),
  )

  window.dispatchEvent(
    new CustomEvent(EXPENSES_UPDATED_EVENT),
  )
}

export function useExpenses(
  tripId?: string,
  budget = 0,
) {
  const [allExpenses, setAllExpenses] =
    useState<Expense[]>(() => readExpenses())

  const reloadExpenses = useCallback(() => {
    setAllExpenses(readExpenses())
  }, [])

  useEffect(() => {
    const handleStorage = (
      event: StorageEvent,
    ) => {
      if (
        event.key === STORAGE_KEY ||
        event.key === null
      ) {
        reloadExpenses()
      }
    }

    const handleExpensesUpdated = () => {
      reloadExpenses()
    }

    window.addEventListener(
      'storage',
      handleStorage,
    )

    window.addEventListener(
      EXPENSES_UPDATED_EVENT,
      handleExpensesUpdated,
    )

    return () => {
      window.removeEventListener(
        'storage',
        handleStorage,
      )

      window.removeEventListener(
        EXPENSES_UPDATED_EVENT,
        handleExpensesUpdated,
      )
    }
  }, [reloadExpenses])

  const expenses = useMemo(() => {
    if (!tripId) {
      return []
    }

    return allExpenses
      .filter(
        (expense) => expense.tripId === tripId,
      )
      .sort((firstExpense, secondExpense) => {
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
      })
  }, [allExpenses, tripId])

  const addExpense = useCallback(
    (input: ExpenseInput): Expense => {
      const now = new Date().toISOString()

      const newExpense: Expense = {
        ...input,
        id: createId(),
        amount: Math.max(0, input.amount),
        title: input.title.trim(),
        paidBy: input.paidBy.trim(),
        notes: input.notes.trim(),
        createdAt: now,
        updatedAt: now,
      }

      const nextExpenses = [
        ...readExpenses(),
        newExpense,
      ]

      saveExpenses(nextExpenses)
      setAllExpenses(nextExpenses)

      return newExpense
    },
    [],
  )

  const updateExpense = useCallback(
    (
      expenseId: string,
      updates: ExpenseUpdate,
    ): Expense | null => {
      let updatedExpense: Expense | null = null

      const nextExpenses = readExpenses().map(
        (expense) => {
          if (expense.id !== expenseId) {
            return expense
          }

          updatedExpense = {
            ...expense,
            ...updates,
            title:
              updates.title !== undefined
                ? updates.title.trim()
                : expense.title,
            amount:
              updates.amount !== undefined
                ? Math.max(0, updates.amount)
                : expense.amount,
            paidBy:
              updates.paidBy !== undefined
                ? updates.paidBy.trim()
                : expense.paidBy,
            notes:
              updates.notes !== undefined
                ? updates.notes.trim()
                : expense.notes,
            updatedAt: new Date().toISOString(),
          }

          return updatedExpense
        },
      )

      if (!updatedExpense) {
        return null
      }

      saveExpenses(nextExpenses)
      setAllExpenses(nextExpenses)

      return updatedExpense
    },
    [],
  )

  const deleteExpense = useCallback(
    (expenseId: string): void => {
      const nextExpenses = readExpenses().filter(
        (expense) => expense.id !== expenseId,
      )

      saveExpenses(nextExpenses)
      setAllExpenses(nextExpenses)
    },
    [],
  )

  const deleteExpensesByTrip = useCallback(
    (targetTripId: string): void => {
      const nextExpenses = readExpenses().filter(
        (expense) =>
          expense.tripId !== targetTripId,
      )

      saveExpenses(nextExpenses)
      setAllExpenses(nextExpenses)
    },
    [],
  )

  const getExpenseById = useCallback(
    (expenseId: string): Expense | undefined =>
      allExpenses.find(
        (expense) => expense.id === expenseId,
      ),
    [allExpenses],
  )

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (total, expense) =>
          total + expense.amount,
        0,
      ),
    [expenses],
  )

  const remainingBudget = useMemo(
    () => budget - totalSpent,
    [budget, totalSpent],
  )

  const budgetUsedPercentage = useMemo(() => {
    if (budget <= 0) {
      return 0
    }

    return Math.max(
      0,
      Math.round((totalSpent / budget) * 100),
    )
  }, [budget, totalSpent])

  const categoryTotals = useMemo<
    CategoryTotal[]
  >(() => {
    const totals = new Map<
      ExpenseCategory,
      number
    >()

    expenses.forEach((expense) => {
      const currentTotal =
        totals.get(expense.category) ?? 0

      totals.set(
        expense.category,
        currentTotal + expense.amount,
      )
    })

    return Array.from(totals.entries())
      .map(([category, total]) => ({
        category,
        total,
        percentage:
          totalSpent > 0
            ? Math.round(
                (total / totalSpent) * 100,
              )
            : 0,
      }))
      .sort(
        (firstCategory, secondCategory) =>
          secondCategory.total -
          firstCategory.total,
      )
  }, [expenses, totalSpent])

  const paidByTotals = useMemo(() => {
    const totals = new Map<string, number>()

    expenses.forEach((expense) => {
      const paidBy =
        expense.paidBy.trim() || 'Non specificato'

      totals.set(
        paidBy,
        (totals.get(paidBy) ?? 0) +
          expense.amount,
      )
    })

    return Array.from(totals.entries())
      .map(([paidBy, total]) => ({
        paidBy,
        total,
      }))
      .sort(
        (firstPerson, secondPerson) =>
          secondPerson.total -
          firstPerson.total,
      )
  }, [expenses])

  return {
    expenses,
    expenseCount: expenses.length,
    totalSpent,
    remainingBudget,
    budgetUsedPercentage,
    categoryTotals,
    paidByTotals,
    addExpense,
    updateExpense,
    deleteExpense,
    deleteExpensesByTrip,
    getExpenseById,
    reloadExpenses,
  }
}