"use client";

import { useActionState } from "react";
import { createExpense, deleteExpense } from "@/lib/actions/expenses";
import { expenseCategories, expenseCategoryLabels } from "@/lib/validations/expense";
import type { Tables } from "@/lib/supabase/database.types";

export function ExpensesSection({
  propertyId,
  organizationId,
  expenses,
}: {
  propertyId: string;
  organizationId: string;
  expenses: Tables<"expenses">[];
}) {
  const redirectPath = `/properties/${propertyId}`;
  const createWithIds = createExpense.bind(null, propertyId, organizationId, redirectPath);
  const [state, action, pending] = useActionState(createWithIds, undefined);

  const total = expenses.reduce((sum, expense) => sum + expense.amount + expense.tax_amount, 0);

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Expenses</h2>
        {expenses.length > 0 && (
          <p className="text-sm text-zinc-500">Total: ${total.toFixed(2)}</p>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {expenses.map((expense) => (
          <li key={expense.id} className="flex items-start justify-between text-sm">
            <div>
              <p className="font-medium">
                ${expense.amount.toFixed(2)}
                {expense.tax_amount > 0 ? ` + $${expense.tax_amount.toFixed(2)} tax` : ""}
              </p>
              <p className="text-xs text-zinc-500">
                {expense.expense_date} -- {expenseCategoryLabels[expense.category as (typeof expenseCategories)[number]]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => deleteExpense(expense.id, redirectPath)}
              className="text-xs text-red-600 underline"
            >
              Remove
            </button>
          </li>
        ))}
        {expenses.length === 0 && <li className="text-sm text-zinc-500">No expenses yet.</li>}
      </ul>

      <form
        action={action}
        className="mt-4 space-y-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label htmlFor="amount" className="text-xs font-medium">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              inputMode="decimal"
              required
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {state?.errors?.amount && (
              <p className="text-xs text-red-600">{state.errors.amount[0]}</p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="taxAmount" className="text-xs font-medium">
              Tax <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="taxAmount"
              name="taxAmount"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="expenseDate" className="text-xs font-medium">
              Date
            </label>
            <input
              id="expenseDate"
              name="expenseDate"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="category" className="text-xs font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue="other"
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {expenseCategories.map((category) => (
              <option key={category} value={category}>
                {expenseCategoryLabels[category]}
              </option>
            ))}
          </select>
        </div>

        {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
        >
          {pending ? "Adding..." : "Add expense"}
        </button>
      </form>
    </section>
  );
}
