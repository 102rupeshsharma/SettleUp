import React from 'react';
import { Utensils, Plane, Home, Wrench, Film, Receipt, Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const CATEGORY_ICONS = {
  food: Utensils,
  travel: Plane,
  rent: Home,
  utilities: Wrench,
  entertainment: Film,
};

const ExpenseCard = ({ expense, currentUserId, currentUserRole, currency, onEdit, onDelete }) => {
  const { formatCurrency } = useCurrency(currency);
  const Icon = CATEGORY_ICONS[expense.category] || Receipt;

  const isCreator = expense.createdBy?._id === currentUserId || expense.createdBy === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canEdit = isCreator || isAdmin;

  const formattedDate = new Date(expense.date || expense.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  const payerId = expense.paidBy?._id || expense.paidBy;
  const paidByMe = payerId === currentUserId;
  const myShare =
    expense.splits.find((s) => s.userId === currentUserId || s.userId?._id === currentUserId)
      ?.amount || 0;

  // What this expense means for the person looking at it.
  let stake;
  if (paidByMe) {
    const lent = expense.amount - myShare;
    stake = lent > 0.005
      ? { label: 'you lent', amount: lent, tone: 'text-pos' }
      : { label: 'your own cost', amount: null, tone: 'text-faint' };
  } else if (myShare > 0.005) {
    stake = { label: 'you owe', amount: myShare, tone: 'text-neg' };
  } else {
    stake = { label: 'not involved', amount: null, tone: 'text-faint' };
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sunken text-muted"
        title={expense.category}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{expense.description}</p>
        <p className="mt-0.5 truncate text-xs text-muted">
          {paidByMe ? 'You' : expense.paidBy?.name || 'Unknown'} paid{' '}
          <span className="tabular-nums">{formatCurrency(expense.amount)}</span>
          <span className="mx-1.5 text-faint">·</span>
          {formattedDate}
          {expense.receiptUrl && (
            <>
              <span className="mx-1.5 text-faint">·</span>
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-ink"
              >
                receipt
              </a>
            </>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-xs ${stake.tone}`}>{stake.label}</p>
        {stake.amount !== null && (
          <p className={`text-sm font-semibold tabular-nums ${stake.tone}`}>
            {formatCurrency(stake.amount)}
          </p>
        )}
      </div>

      {canEdit && (
        <div className="flex shrink-0 items-center sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
          <button
            onClick={() => onEdit(expense)}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-sunken hover:text-ink"
            title="Edit Expense"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(expense._id)}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-neg-soft hover:text-neg"
            title="Delete Expense"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
};

export default ExpenseCard;
