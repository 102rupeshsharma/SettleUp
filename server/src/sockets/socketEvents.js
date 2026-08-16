import { getIO } from './socketServer.js';

const getRoomEmitter = (groupId) => {
  const io = getIO();
  if (!io) return null;
  return io.to(`group:${groupId}`);
};

export const emitExpenseAdded = (groupId, expense) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('expense:added', { expense });
  }
};

export const emitExpenseUpdated = (groupId, expense) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('expense:updated', { expense });
  }
};

export const emitExpenseDeleted = (groupId, expenseId) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('expense:deleted', { expenseId });
  }
};

export const emitSettlementMade = (groupId, settlement) => {
  const emitter = getRoomEmitter(groupId);
  if (emitter) {
    emitter.emit('settlement:made', { settlement });
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
