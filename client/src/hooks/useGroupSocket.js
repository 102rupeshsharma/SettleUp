import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

export const useGroupSocket = (groupId, onExpenseAdded, onExpenseUpdated, onExpenseDeleted, onSettlementMade) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !groupId) return;

    socket.emit('join-group', { groupId });

    if (onExpenseAdded) socket.on('expense:added', onExpenseAdded);
    if (onExpenseUpdated) socket.on('expense:updated', onExpenseUpdated);
    if (onExpenseDeleted) socket.on('expense:deleted', onExpenseDeleted);
    if (onSettlementMade) socket.on('settlement:made', onSettlementMade);

    return () => {
      socket.emit('leave-group', { groupId });
      if (onExpenseAdded) socket.off('expense:added', onExpenseAdded);
      if (onExpenseUpdated) socket.off('expense:updated', onExpenseUpdated);
      if (onExpenseDeleted) socket.off('expense:deleted', onExpenseDeleted);
      if (onSettlementMade) socket.off('settlement:made', onSettlementMade);
    };
  }, [socket, groupId, onExpenseAdded, onExpenseUpdated, onExpenseDeleted, onSettlementMade]);
};

export default useGroupSocket;
