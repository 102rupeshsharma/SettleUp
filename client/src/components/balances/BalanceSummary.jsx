import React from 'react';
import Avatar from '../ui/Avatar';
import { useCurrency } from '../../hooks/useCurrency';

const BalanceSummary = ({ balances, currency }) => {
  const { formatCurrency } = useCurrency(currency);

  return (
    <section>
      <h3 className="font-display text-base font-semibold text-ink">Where everyone stands</h3>
      <ul className="panel mt-3 divide-y divide-line">
        {balances.map((b) => {
          const isCreditor = b.net > 0.01;
          const isDebtor = b.net < -0.01;

          return (
            <li key={b.userId} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={b.name} src={b.avatar} />
                <span className="truncate text-sm font-medium text-ink">{b.name}</span>
              </div>

              {isCreditor ? (
                <span className="shrink-0 text-right text-sm text-pos">
                  gets back <span className="font-semibold tabular-nums">{formatCurrency(b.net)}</span>
                </span>
              ) : isDebtor ? (
                <span className="shrink-0 text-right text-sm text-neg">
                  owes <span className="font-semibold tabular-nums">{formatCurrency(Math.abs(b.net))}</span>
                </span>
              ) : (
                <span className="shrink-0 text-sm text-faint">settled up</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default BalanceSummary;
