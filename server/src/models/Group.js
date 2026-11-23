import mongoose from 'mongoose';
import crypto from 'crypto';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member', 'viewer'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
    },
    // Every amount in a group is in this one currency. Groups created before
    // this field existed fall back to INR, the app's original default.
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.pre('save', async function (next) {
  if (!this.inviteCode) {
    let unique = false;
    while (!unique) {
      const code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await mongoose.models.Group.findOne({ inviteCode: code });
      if (!existing) {
        this.inviteCode = code;
        unique = true;
      }
    }
  }
  next();
});

const Group = mongoose.model('Group', groupSchema);
export default Group;
