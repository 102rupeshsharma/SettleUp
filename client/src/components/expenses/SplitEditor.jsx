import React, { useEffect } from 'react';
import { useCurrency } from '../../hooks/useCurrency';

const round2 = (value) => parseFloat(value.toFixed(2));

// Equal parts between the given people; the last one absorbs the rounding
// remainder so the parts always add up to the total.
const equalSplits = (userIds, total) => {
  const count = userIds.length;
  if (count === 0) return [];
  const each = round2(total / count);
  let sum = 0;
  return userIds.map((userId, idx) => {
    const amount = idx === count - 1 ? round2(total - sum) : each;
    sum += amount;
    return { userId, amount };
  });
};

// Proportional to each person's share count (2:1:1). People with no shares
// stay in the list with a zero amount so their input keeps its place.
const sharesSplits = (entries, total) => {
  const totalShares = entries.reduce((acc, e) => acc + (e.shares > 0 ? e.shares : 0), 0);
  const lastPayingIdx = entries.reduce((last, e, idx) => (e.shares > 0 ? idx : last), -1);
  let sum = 0;
  return entries.map((e, idx) => {
    if (!(e.shares > 0) || totalShares === 0) {
      return { userId: e.userId, shares: e.shares || 0, amount: 0 };
    }
    const amount = idx === lastPayingIdx ? round2(total - sum) : round2((total * e.shares) / totalShares);
    sum += amount;
    return { userId: e.userId, shares: e.shares, amount };
  });
};

const SplitEditor = ({ members, amount, splitType, splits, currency, onChange }) => {
  const { formatCurrency, currencySymbol } = useCurrency(currency);
  const parsedAmount = parseFloat(amount) || 0;
  const memberIds = members.map((m) => m.userId?._id).filter(Boolean);

  useEffect(() => {
    if (memberIds.length === 0) return;

    if (splitType === 'equal') {
      // Keep whoever is already ticked; with nothing chosen yet, include everyone.
      const chosen = memberIds.filter((id) => splits.some((s) => s.userId === id));
      onChange(equalSplits(chosen.length > 0 ? chosen : memberIds, parsedAmount));
    } else if (splitType === 'shares') {
      // First time in this mode everyone starts with one share.
      const hasShares = splits.some((s) => s.shares > 0);
      const entries = memberIds.map((id) => {
        const existing = splits.find((s) => s.userId === id);
        return { userId: id, shares: hasShares ? existing?.shares || 0 : 1 };
      });
      onChange(sharesSplits(entries, parsedAmount));
    }
  }, [parsedAmount, splitType, members]);

  const isIncluded = (userId) =>
    splits.length === 0 || splits.some((s) => s.userId === userId);

  const handleToggle = (userId) => {
    const current = memberIds.filter((id) => isIncluded(id));
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : memberIds.filter((id) => current.includes(id) || id === userId);
    // An expense has to be shared by at least one person.
    if (next.length === 0) return;
    onChange(equalSplits(next, parsedAmount));
  };

  const handleExactChange = (userId, value) => {
    const numericValue = parseFloat(value) || 0;
    const newSplits = members.map((m) => {
      const existing = splits.find((s) => s.userId === m.userId._id);
      const amt = m.userId._id === userId ? numericValue : (existing ? existing.amount : 0);
      return { userId: m.userId._id, amount: amt };
    });
    onChange(newSplits);
  };

  const handlePercentageChange = (userId, value) => {
    const numericValue = parseFloat(value) || 0;
    const newSplits = members.map((m) => {
      const existing = splits.find((s) => s.userId === m.userId._id);
      const pct = m.userId._id === userId ? numericValue : (existing ? existing.percentage : 0);

      const calculatedAmt = parseFloat((parsedAmount * (pct / 100)).toFixed(2));
      return { userId: m.userId._id, percentage: pct, amount: calculatedAmt };
    });
    onChange(newSplits);
  };

  const handleSharesChange = (userId, value) => {
    const numericValue = Math.max(0, parseFloat(value) || 0);
    const entries = memberIds.map((id) => {
      const existing = splits.find((s) => s.userId === id);
      return { userId: id, shares: id === userId ? numericValue : existing?.shares || 0 };
    });
    onChange(sharesSplits(entries, parsedAmount));
  };

  const sumOfSplits = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const sumOfPercentages = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
  const sumOfShares = splits.reduce((sum, s) => sum + (s.shares || 0), 0);

  const isExactValid = Math.abs(sumOfSplits - parsedAmount) <= 0.01;
  const isPercentageValid = Math.abs(sumOfPercentages - 100) <= 0.01;

  const includedCount = memberIds.filter((id) => isIncluded(id)).length;

  return (
    <div className="rounded-md border border-line">
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <h3 className="text-sm font-medium text-ink">Each person's share</h3>
        {splitType === 'equal' && (
          <span className="text-xs text-muted">
            {includedCount} of {memberIds.length} people
          </span>
        )}
        {splitType === 'exact' && (
          <span className={`text-xs font-medium tabular-nums ${isExactValid ? 'text-pos' : 'text-neg'}`}>
            Sum: {sumOfSplits.toFixed(2)} / {parsedAmount.toFixed(2)}
          </span>
        )}
        {splitType === 'percentage' && (
          <span className={`text-xs font-medium tabular-nums ${isPercentageValid ? 'text-pos' : 'text-neg'}`}>
            Sum: {sumOfPercentages.toFixed(1)}% / 100%
          </span>
        )}
        {splitType === 'shares' && (
          <span className={`text-xs font-medium tabular-nums ${sumOfShares > 0 ? 'text-muted' : 'text-neg'}`}>
            {sumOfShares} {sumOfShares === 1 ? 'share' : 'shares'} in total
          </span>
        )}
      </div>

      <div className="divide-y divide-line">
        {members.map((member) => {
          const userObj = member.userId;
          if (!userObj) return null;

          const currentSplit = splits.find((s) => s.userId === userObj._id);
          const currentVal = currentSplit
            ? (splitType === 'percentage'
                ? currentSplit.percentage
                : splitType === 'shares'
                  ? currentSplit.shares
                  : currentSplit.amount)
            : 0;
          const included = isIncluded(userObj._id);

          return (
            <div key={userObj._id} className="flex items-center justify-between gap-4 px-3 py-2">
              {splitType === 'equal' ? (
                <label className="flex min-w-0 cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={() => handleToggle(userObj._id)}
                    className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  />
                  <span className={`truncate text-sm ${included ? 'text-ink' : 'text-muted'}`}>
                    {userObj.name}
                  </span>
                </label>
              ) : (
                <span className="min-w-0 truncate text-sm text-ink">{userObj.name}</span>
              )}

              <div className="flex shrink-0 items-center gap-2">
                {splitType === 'equal' ? (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-faint">{currencySymbol}</span>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      aria-label={`${userObj.name}'s share`}
                      value={currentSplit?.amount?.toFixed(2) || '0.00'}
                      className={`w-28 rounded-md border border-transparent bg-sunken py-1.5 pr-2.5 pl-8 text-right text-sm tabular-nums outline-none ${included ? 'text-muted' : 'text-faint'}`}
                    />
                  </div>
                ) : splitType === 'exact' ? (
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-faint">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      aria-label={`${userObj.name}'s share`}
                      value={currentVal || ''}
                      onChange={(e) => handleExactChange(userObj._id, e.target.value)}
                      className="field w-28 py-1.5 pr-2.5 pl-8 text-right tabular-nums"
                      placeholder="0.00"
                    />
                  </div>
                ) : splitType === 'shares' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      aria-label={`${userObj.name}'s number of shares`}
                      value={currentVal || ''}
                      onChange={(e) => handleSharesChange(userObj._id, e.target.value)}
                      className="field w-20 py-1.5 text-right tabular-nums"
                      placeholder="0"
                    />
                    <span className="w-24 text-right text-xs tabular-nums text-muted">
                      {formatCurrency(currentSplit?.amount || 0)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      aria-label={`${userObj.name}'s percentage`}
                      value={currentVal || ''}
                      onChange={(e) => handlePercentageChange(userObj._id, e.target.value)}
                      className="field w-20 py-1.5 text-right tabular-nums"
                      placeholder="0"
                    />
                    <span className="text-sm text-muted">%</span>
                    <span className="w-24 text-right text-xs tabular-nums text-muted">
                      {formatCurrency(currentSplit?.amount || 0)}
                    </span>
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

export default SplitEditor;
