import { getIO } from './socketServer.js';

const getRoomEmitter = (groupId) => {
  const io = getIO();
  if (!io) return null;
  return io.to(`group:${groupId}`);
};

// `currency` is the group's currency, sent along so clients can format the
// amount without looking the group up.
export const emitExpenseAdded = (groupId, expense, currency) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('expense:added', { expense, currency });
  }
};

export const emitExpenseUpdated = (groupId, expense, currency) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('expense:updated', { expense, currency });
  }
};

export const emitExpenseDeleted = (groupId, expenseId) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('expense:deleted', { expenseId });
  }
};

export const emitSettlementMade = (groupId, settlement, currency) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('settlement:made', { settlement, currency });
  }
};

export const emitMemberJoined = (groupId, userId, name) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('member:joined', { userId, name });
  }
};

export const emitMemberLeft = (groupId, userId) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('member:left', { userId });
  }
};

export const emitMemberRoleChanged = (groupId, userId, newRole) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('member:role-changed', { userId, newRole });
  }
};
