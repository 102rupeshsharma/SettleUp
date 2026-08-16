import React from 'react';
import { Utensils, Plane, Home, Wrench, Film, HelpCircle, Edit, Trash2, Calendar } from 'lucide-react';

const ExpenseCard = ({ expense, currentUserId, currentUserRole, onEdit, onDelete }) => {
  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'food':
        return <Utensils className="h-5 w-5 text-amber-400" />;
      case 'travel':
        return <Plane className="h-5 w-5 text-sky-400" />;
      case 'rent':
        return <Home className="h-5 w-5 text-indigo-400" />;
      case 'utilities':
        return <Wrench className="h-5 w-5 text-teal-400" />;
      case 'entertainment':
        return <Film className="h-5 w-5 text-rose-400" />;
      default:
        return <HelpCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const isCreator = expense.createdBy?._id === currentUserId || expense.createdBy === currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const canEdit = isCreator || isAdmin;

  const formattedDate = new Date(expense.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-800/80 transition-colors duration-200 shadow-sm dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900">
            {getCategoryIcon(expense.category)}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200">{expense.description}</h4>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
              <span className="capitalize">{expense.category}</span>
              {expense.receiptUrl && (
                <>
                  <span className="text-slate-700">•</span>
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                  >
                    View Receipt
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
            ${expense.amount.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Paid by {expense.paidBy?.name || 'Unknown'}
          </span>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-900 pt-3 flex items-center justify-between text-xs">
        <div className="text-slate-500 dark:text-slate-400">
          Your Share:{' '}
          <span className="font-bold text-slate-800 dark:text-slate-200">
            $
            {(
              expense.splits.find((s) => s.userId === currentUserId || s.userId?._id === currentUserId)
                ?.amount || 0
            ).toFixed(2)}
          </span>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(expense)}
              className="p-1 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Edit Expense"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(expense._id)}
              className="p-1 rounded text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              title="Delete Expense"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseCard;
