import React, { useEffect, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { X, Info } from 'lucide-react';

const Toast = () => {
  const socket = useSocket();
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);

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

    const handleExpenseAdded = ({ expense }) => {
      const actorId = expense.createdBy?._id || expense.createdBy;
      if (actorId.toString() !== user._id.toString()) {
        addToast(`New Expense: ${expense.paidBy?.name || 'Someone'} added "${expense.description}" ($${expense.amount})`);
      }
    };

    const handleExpenseUpdated = ({ expense }) => {
      const actorId = expense.createdBy?._id || expense.createdBy;
      if (actorId.toString() !== user._id.toString()) {
        addToast(`Updated Expense: "${expense.description}" was modified`);
      }
    };

    const handleExpenseDeleted = () => {
      addToast(`Deleted Expense: An expense was removed from the group`);
    };

    const handleSettlementMade = ({ settlement }) => {
      const actorId = settlement.fromUser?._id || settlement.fromUser;
      if (actorId.toString() !== user._id.toString()) {
        addToast(`Settlement Recorded: ${settlement.fromUser?.name || 'Someone'} paid ${settlement.toUser?.name || 'Someone'} ($${settlement.amount})`);
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
    <div className="fixed bottom-5 right-5 z-[9999] max-w-sm space-y-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-slate-900 px-4 py-3 text-xs text-slate-100 shadow-2xl ring-1 ring-emerald-500/10 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
