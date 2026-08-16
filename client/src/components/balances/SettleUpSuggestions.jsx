import React from 'react';
import { ArrowRight, DollarSign } from 'lucide-react';

const SettleUpSuggestions = ({ suggestions, currentUserId, onSettle }) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        Suggested Payments (Minimized Debts)
      </h3>

      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/10 text-slate-500 shadow-sm dark:shadow-none">
          <p className="text-sm font-semibold">Everything is fully settled up! No transactions suggested.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((s, idx) => {
            const isOwer = s.fromUser._id === currentUserId;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 hover:border-slate-300 dark:hover:border-slate-800 transition-colors shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{s.fromUser.name}</span>
                  <ArrowRight className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">{s.toUser.name}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    ${s.amount.toFixed(2)}
                  </span>
                  {isOwer && (
                    <button
                      onClick={() => onSettle(s)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all text-slate-950"
                    >
                      <DollarSign className="h-3 w-3" />
                      Settle Up
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SettleUpSuggestions;
