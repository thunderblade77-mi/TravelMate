export type ExpenseCategory =
  | 'restaurant'
  | 'bar'
  | 'groceries'
  | 'taxi'
  | 'fuel'
  | 'tolls'
  | 'parking'
  | 'accommodation'
  | 'activities'
  | 'shopping'
  | 'transport'
  | 'health'
  | 'other'
  | 'food'

export type ExpensePaymentMethod =
  | 'cash'
  | 'card'
  | 'bank-transfer'
  | 'other'

export type ExpenseSplitKind =
  | 'none'
  | 'participants'
  | 'families'

export type Expense = {
  id: string
  tripId: string
  title: string
  merchant: string
  amount: number
  category: ExpenseCategory
  date: string
  paidBy: string
  paymentMethod: ExpensePaymentMethod
  splitKind: ExpenseSplitKind
  splitWith: string[]
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
    value: 'restaurant',
    label: 'Ristorante',
    icon: '🍽️',
  },
  {
    value: 'bar',
    label: 'Bar / Caffè',
    icon: '☕',
  },
  {
    value: 'groceries',
    label: 'Spesa supermercato',
    icon: '🛒',
  },
  {
    value: 'taxi',
    label: 'Taxi / Ride sharing',
    icon: '🚕',
  },
  {
    value: 'fuel',
    label: 'Carburante',
    icon: '⛽',
  },
  {
    value: 'tolls',
    label: 'Pedaggi',
    icon: '🛣️',
  },
  {
    value: 'parking',
    label: 'Parcheggi',
    icon: '🅿️',
  },
  {
    value: 'accommodation',
    label: 'Hotel / Alloggio',
    icon: '🏨',
  },
  {
    value: 'activities',
    label: 'Attività / Ingressi',
    icon: '🎟️',
  },
  {
    value: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
  },
  {
    value: 'transport',
    label: 'Trasporti',
    icon: '🚆',
  },
  {
    value: 'health',
    label: 'Farmacia / Salute',
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