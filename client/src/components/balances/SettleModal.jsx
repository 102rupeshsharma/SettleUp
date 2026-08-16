import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { X, Loader2, CreditCard } from 'lucide-react';

const SettleModal = ({ isOpen, onClose, suggestion, groupId, onSuccess }) => {
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !suggestion) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post(`/groups/${groupId}/settle`, {
        toUser: suggestion.toUser._id,
        amount: suggestion.amount,
        method,
      });
      onSuccess(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 p-6 shadow-2xl dark:shadow-none animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            Record Settlement
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-500 dark:text-rose-400 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-3 rounded-lg bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-900/60 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Pay From</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{suggestion.fromUser.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pay To</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{suggestion.toUser.name}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-900 pt-2.5">
              <span className="text-slate-500 font-medium">Settle Amount</span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                ${suggestion.amount.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="methodSelect" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Payment Method
            </label>
            <select
              id="methodSelect"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-grow flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 transition-colors text-slate-950"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                'Confirm Settlement'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-grow rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettleModal;
