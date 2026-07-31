export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'health'
  | 'other'

export type ExpensePaymentMethod =
  | 'cash'
  | 'card'
  | 'bank-transfer'
  | 'other'

export type Expense = {
  id: string
  tripId: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  paidBy: string
  paymentMethod: ExpensePaymentMethod
  notes: string
  createdAt: string
  updatedAt: string
}

export type ExpenseCategoryOption = {
  value: ExpenseCategory
  label: string
  icon: string
}

export type ExpensePaymentMethodOption = {
  value: ExpensePaymentMethod
  label: string
}

export const EXPENSE_CATEGORY_OPTIONS: ExpenseCategoryOption[] = [
  {
    value: 'food',
    label: 'Cibo',
    icon: '🍝',
  },
  {
    value: 'transport',
    label: 'Trasporti',
    icon: '🚆',
  },
  {
    value: 'accommodation',
    label: 'Alloggio',
    icon: '🏨',
  },
  {
    value: 'activities',
    label: 'Attività',
    icon: '🎟️',
  },
  {
    value: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
  },
  {
    value: 'health',
    label: 'Salute',
    icon: '💊',
  },
  {
    value: 'other',
    label: 'Altro',
    icon: '📦',
  },
]

export const EXPENSE_PAYMENT_METHOD_OPTIONS: ExpensePaymentMethodOption[] =
  [
    {
      value: 'cash',
      label: 'Contanti',
    },
    {
      value: 'card',
      label: 'Carta',
    },
    {
      value: 'bank-transfer',
      label: 'Bonifico',
    },
    {
      value: 'other',
      label: 'Altro',
    },
  ]