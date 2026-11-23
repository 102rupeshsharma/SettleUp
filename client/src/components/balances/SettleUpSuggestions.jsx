import React from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const SettleUpSuggestions = ({ suggestions, currentUserId, currency, onSettle, onRemind, remindingId }) => {
  const { formatCurrency } = useCurrency(currency);

  return (
    <section>
      <h3 className="font-display text-base font-semibold text-ink">How to settle up</h3>

      {suggestions.length === 0 ? (
        <p className="panel mt-3 px-4 py-8 text-center text-sm text-muted">
          Nobody owes anything right now.
        </p>
      ) : (
        <>
          <ul className="panel mt-3 divide-y divide-line">
            {suggestions.map((s, idx) => {
              const isOwer = s.fromUser._id === currentUserId;
              const isReceiver = s.toUser._id === currentUserId;

              return (
                <li key={idx} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-ink">
                      <span className="font-medium">{isOwer ? 'You' : s.fromUser.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-label="pays" />
                      <span className="font-medium">{isReceiver ? 'you' : s.toUser.name}</span>
                    </p>
                    <p className="mt-0.5 text-sm tabular-nums text-muted">{formatCurrency(s.amount)}</p>
                  </div>

                  {isOwer && (
                    <button onClick={() => onSettle(s)} className="btn btn-primary shrink-0">
                      Settle up
                    </button>
                  )}

                  {isReceiver && onRemind && (
                    <button
                      onClick={() => onRemind(s)}
                      disabled={remindingId === s.fromUser._id}
                      className="btn btn-secondary shrink-0"
                    >
                      {remindingId === s.fromUser._id && <Loader2 className="h-4 w-4 animate-spin" />}
                      Remind
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted">
            This is the smallest number of payments that clears every balance.
          </p>
        </>
      )}
    </section>
  );
};

export default SettleUpSuggestions;
