import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      enum: ['food', 'travel', 'rent', 'utilities', 'entertainment', 'other'],
      default: 'other',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage', 'shares'],
      required: true,
    },
    splits: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        // Kept so a percentage or shares split can be edited later.
        percentage: Number,
        shares: Number,
      },
    ],
    // When the money was spent. Older expenses have no value here and fall
    // back to createdAt wherever a date is shown or sorted on.
    date: {
      type: Date,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.pre('validate', function (next) {
  if (this.splits && this.splits.length > 0) {
    const totalSplits = this.splits.reduce((sum, item) => sum + item.amount, 0);
    if (Math.abs(totalSplits - this.amount) > 0.01) {
      this.invalidate('splits', 'Sum of split amounts must equal the total expense amount');
    }
  }
  next();
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
