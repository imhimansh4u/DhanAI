import mongoose  from "mongoose";
const { Schema } = mongoose;
const budgetsSchema = new mongoose.Schema(
  {
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    lastAlertSent: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Budgets = mongoose.models.Budgets || mongoose.model("Budgets",budgetsSchema);

export default Budgets; 
