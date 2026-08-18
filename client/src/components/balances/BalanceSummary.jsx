import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle, User } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const BalanceSummary = ({ balances }) => {
  const { formatCurrency } = useCurrency();

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        Member Balances Summary
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {balances.map((b) => {
          const isCreditor = b.net > 0.01;
          const isDebtor = b.net < -0.01;

          return (
            <div
              key={b.userId}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900/15 hover:border-slate-305 dark:hover:border-slate-800 transition-colors shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-3">
                {b.avatar ? (
                  <img
                    src={b.avatar}
                    alt={b.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block text-sm">{b.name}</span>
                  <span className="text-[10px] text-slate-500">{b.email}</span>
                </div>
              </div>

              <div className="text-right">
                {isCreditor ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    Owed {formatCurrency(b.net)}
                  </div>
                ) : isDebtor ? (
                  <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-bold text-sm">
                    <TrendingDown className="h-4 w-4 shrink-0" />
                    Owes {formatCurrency(Math.abs(b.net))}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-sm">
                    <CheckCircle className="h-4 w-4 shrink-0 text-slate-400" />
                    Settled up
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BalanceSummary;
