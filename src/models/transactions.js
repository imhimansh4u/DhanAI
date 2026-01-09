import mongoose from "mongoose";

const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    transactionType: {
      type: String,
      enum: ["INCOME", "EXPENSE"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    description: {
      type: String,
    },
    category: {
      type: String,
    },
    receiptUrl: {
      type: String,
    },
    isRecurring: {
      //this is for all the Recurring transactions
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
    },
    nextRecurringDate: {
      type: Date,
    },
    lastProcessed: {
      type: Date,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now, // use the same as createdAt if not provided
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction",transactionSchema);
export default Transaction;