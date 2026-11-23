import mongoose from 'mongoose';

// One line in a group's history: who did what, and when.
const activitySchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'expense_added',
        'expense_updated',
        'expense_deleted',
        'settlement_made',
        'member_joined',
        'member_left',
        'member_removed',
        'role_changed',
      ],
      required: true,
    },
    // Reads as the rest of a sentence after the actor's name,
    // e.g. 'added "Dinner" (₹1,200.00)'.
    summary: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
