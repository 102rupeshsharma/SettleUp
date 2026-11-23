import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Modal from '../ui/Modal';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
];

/*
 * Records a payment from the signed-in user to someone else in the group.
 * With a `suggestion` it starts from that suggested payment (the amount can
 * still be changed, e.g. to pay part of it). Without one, the user picks who
 * they paid and how much.
 *
 * Mount it only while open so each opening starts from fresh values.
 */
const SettleModal = ({ isOpen, onClose, suggestion, members = [], currentUserId, groupId, currency, onSuccess }) => {
  const { formatCurrency, currencySymbol } = useCurrency(currency);

  const recipients = members
    .map((m) => m.userId)
    .filter((u) => u && u._id !== currentUserId);

  const [toUser, setToUser] = useState(suggestion?.toUser?._id || recipients[0]?._id || '');
  const [amount, setAmount] = useState(suggestion ? String(suggestion.amount) : '');
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const parsedAmount = parseFloat(amount);
  const isPartial =
    suggestion && !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount < suggestion.amount - 0.005;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!toUser) {
      setError('Choose who you paid');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter an amount greater than zero');
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/groups/${groupId}/settle`, {
        toUser,
        amount: parseFloat(parsedAmount.toFixed(2)),
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
    <Modal title="Record a payment" onClose={onClose}>
      {error && (
        <p role="alert" className="notice-error mt-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        {suggestion ? (
          <p className="text-sm text-muted">
            You owe <span className="font-medium text-ink">{suggestion.toUser.name}</span>{' '}
            <span className="tabular-nums">{formatCurrency(suggestion.amount)}</span>.
          </p>
        ) : (
          <div>
            <label htmlFor="settleTo" className="field-label">Who did you pay?</label>
            {recipients.length === 0 ? (
              <p className="text-sm text-muted">There's nobody else in this group yet.</p>
            ) : (
              <select
                id="settleTo"
                value={toUser}
                onChange={(e) => setToUser(e.target.value)}
                className="field"
              >
                {recipients.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div>
          <label htmlFor="settleAmount" className="field-label">Amount paid</label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
              {currencySymbol}
            </span>
            <input
              id="settleAmount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field pl-9 tabular-nums"
              placeholder="0.00"
            />
          </div>
          {isPartial && (
            <p className="mt-1.5 text-xs text-muted">
              Part payment. {formatCurrency(suggestion.amount - parsedAmount)} will still be owed.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="field-label">How was it paid?</legend>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <label
                key={m.value}
                className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
                  method === m.value
                    ? 'border-ink bg-sunken font-medium text-ink'
                    : 'border-line text-muted hover:bg-sunken'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={(e) => setMethod(e.target.value)}
                  className="sr-only"
                />
                {m.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading || (!suggestion && recipients.length === 0)} className="btn btn-primary">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              'Record payment'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SettleModal;
