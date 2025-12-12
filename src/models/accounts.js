import mongoose from "mongoose";

const accountsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    accountType: {
      type: String,
      required: [true, "Please provide the account type"],
      enum : ["CURRENT","SAVINGS"]
    },
    balance: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Account =
  mongoose.models.Account || mongoose.model("Account", accountsSchema);

export default Account;
