import Activity from '../models/Activity.js';

// Recording history must never break the action it describes, so failures
// are logged and swallowed.
export const logActivity = async (groupId, actorId, type, summary) => {
  try {
    await Activity.create({ groupId, actor: actorId, type, summary });
  } catch (err) {
    console.error('[Activity] Failed to record activity:', err.message);
  }
};
