import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { X } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const Toast = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const { formatCurrency } = useCurrency();

  const addToast = (message) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (!socket || !user) return;

    // Events carry the group's currency. If one arrives without it, the amount
    // is left out rather than shown with the wrong symbol.
    const amountText = (amount, currency) =>
      currency ? ` (${formatCurrency(amount, currency)})` : '';

    const handleExpenseAdded = ({ expense, currency }) => {
      const actorId = expense.createdBy?._id || expense.createdBy;
      if (actorId.toString() !== user._id.toString()) {
        addToast(`${expense.paidBy?.name || 'Someone'} added "${expense.description}"${amountText(expense.amount, currency)}`);
      }
    };

    const handleExpenseUpdated = ({ expense }) => {
      const actorId = expense.createdBy?._id || expense.createdBy;
      if (actorId.toString() !== user._id.toString()) {
        addToast(`"${expense.description}" was updated`);
      }
    };

    const handleExpenseDeleted = () => {
      addToast('An expense was deleted');
    };

    const handleSettlementMade = ({ settlement, currency }) => {
      const actorId = settlement.fromUser?._id || settlement.fromUser;
      if (actorId.toString() !== user._id.toString()) {
        addToast(`${settlement.fromUser?.name || 'Someone'} paid ${settlement.toUser?.name || 'someone'}${amountText(settlement.amount, currency)}`);
      }
    };

    socket.on('expense:added', handleExpenseAdded);
    socket.on('expense:updated', handleExpenseUpdated);
    socket.on('expense:deleted', handleExpenseDeleted);
    socket.on('settlement:made', handleSettlementMade);

    return () => {
      socket.off('expense:added', handleExpenseAdded);
      socket.off('expense:updated', handleExpenseUpdated);
      socket.off('expense:deleted', handleExpenseDeleted);
      socket.off('settlement:made', handleSettlementMade);
    };
  }, [socket, user]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[9999] max-w-sm space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="anim-pop pointer-events-auto flex items-center justify-between gap-3 rounded-md bg-ink px-4 py-3 text-sm text-page shadow-lg"
        >
          <span>{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
