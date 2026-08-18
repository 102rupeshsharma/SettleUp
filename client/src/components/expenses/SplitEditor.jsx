import React, { useEffect } from 'react';
import { useCurrency } from '../../hooks/useCurrency';

const SplitEditor = ({ members, amount, splitType, splits, onChange }) => {
  const { formatCurrency, currencySymbol } = useCurrency();
  const parsedAmount = parseFloat(amount) || 0;

  useEffect(() => {
    if (splitType === 'equal') {
      const count = members.length;
      if (count === 0) return;
      const equalAmount = parseFloat((parsedAmount / count).toFixed(2));
      let sum = 0;
      const newSplits = members.map((m, idx) => {
        let userAmount = equalAmount;
        if (idx === count - 1) {
          userAmount = parseFloat((parsedAmount - sum).toFixed(2));
        }
        sum += userAmount;
        return { userId: m.userId._id, amount: userAmount };
      });
      onChange(newSplits);
    }
  }, [parsedAmount, splitType, members]);

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

  const sumOfSplits = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const sumOfPercentages = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);

  const isExactValid = Math.abs(sumOfSplits - parsedAmount) <= 0.01;
  const isPercentageValid = Math.abs(sumOfPercentages - 100) <= 0.01;

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950 p-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-sm font-bold text-slate-300">Splits Division</h3>
        {splitType === 'exact' && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isExactValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            Sum: {sumOfSplits.toFixed(2)} / {parsedAmount.toFixed(2)}
          </span>
        )}
        {splitType === 'percentage' && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isPercentageValid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            Sum: {sumOfPercentages.toFixed(1)}% / 100%
          </span>
        )}
      </div>

      <div className="space-y-3">
        {members.map((member) => {
          const userObj = member.userId;
          if (!userObj) return null;

          const currentSplit = splits.find((s) => s.userId === userObj._id);
          const currentVal = currentSplit
            ? (splitType === 'percentage' ? currentSplit.percentage : currentSplit.amount)
            : 0;

          return (
            <div key={userObj._id} className="flex items-center justify-between gap-4">
              <span className="text-sm text-slate-300 font-medium">{userObj.name}</span>
              <div className="flex items-center gap-2">
                {splitType === 'equal' ? (
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-500">{currencySymbol}</span>
                    <input
                      type="text"
                      readOnly
                      value={currentSplit?.amount?.toFixed(2) || '0.00'}
                      className="w-24 rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-7 pr-3 text-right text-xs text-slate-400 outline-none"
                    />
                  </div>
                ) : splitType === 'exact' ? (
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-500">{currencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={currentVal || ''}
                      onChange={(e) => handleExactChange(userObj._id, e.target.value)}
                      className="w-28 rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-7 pr-3 text-right text-xs text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={currentVal || ''}
                      onChange={(e) => handlePercentageChange(userObj._id, e.target.value)}
                      className="w-24 rounded-lg border border-slate-800 bg-slate-900 py-1.5 px-3 text-right text-xs text-white focus:border-emerald-500 focus:outline-none"
                      placeholder="0"
                    />
                    <span className="text-xs text-slate-500">%</span>
                    <span className="w-16 text-right text-xs text-slate-400">
                      ({formatCurrency(currentSplit?.amount || 0)})
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
