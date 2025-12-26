"use server";

import { auth } from "@clerk/nextjs/server";
import { connect } from "@/dbConfig/dbConfig";
import mongoose from "mongoose";
import User from "@/models/userModel";
import Budget from "@/models/budgets";
import Transaction from "@/models/transactions";
import { revalidatePath } from "next/cache";

const serializeBudget = async (doc) => {
  if (!doc) return null;

  // Convert Mongoose Document → Plain Object
  const obj =
    typeof doc.toObject === "function"
      ? doc.toObject({ versionKey: false })
      : doc;

  // Helper for Decimal128 → Number conversion
  const convertDecimalToNumber = (val) => {
    if (val && typeof val === "object" && val._bsontype === "Decimal128") {
      return parseFloat(val.toString());
    }
    return val;
  };

  // Return a fully serialized version
  return {
    ...obj,
    _id: obj._id?.toString(),
    userId: obj.userId?.toString(),
    amount: convertDecimalToNumber(obj.amount),
    lastAlertSent: obj.lastAlertSent
      ? new Date(obj.lastAlertSent).toISOString()
      : null,
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
  };
};

export async function getCurrentBudget(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await connect();
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      throw new Error("User Not Found");
    }

    // Now find the Budget
    const budget = (await Budget.findOne({ userId: user._id })) || null;
    // Now serialize the Budget
    const serializedBudget = await serializeBudget(budget);

    // get the expense of current month
    const currentDate = new Date();

    const startOfMonth = new Date( //new Date(year, monthIndex, day)
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    // end of the month
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // Build match object and convert accountId to ObjectId when needed
    // Match by user + transaction type and DATE RANGE.
    // Transactions may store the timestamp in `date` or rely on `createdAt` (timestamps: true).
    const dateRange = {
      $gte: startOfMonth,
      $lte: endOfMonth,
    };

    const match = {
      userId: user._id,
      transactionType: "EXPENSE",
      $or: [{ date: dateRange }, { createdAt: dateRange }],
    };

    if (accountId) {
      try {
        match.accountId = new mongoose.Types.ObjectId(accountId);
      } catch (e) {
        // if conversion fails, fall back to original value (maybe already ObjectId)
        match.accountId = accountId;
      }
    }

    const expenses = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalExpenseRaw = expenses[0]?.totalExpense;
    let totalExpense = 0;
    if (totalExpenseRaw != null) {
      if (
        typeof totalExpenseRaw === "object" &&
        totalExpenseRaw._bsontype === "Decimal128"
      ) {
        totalExpense = parseFloat(totalExpenseRaw.toString());
      } else {
        totalExpense = Number(totalExpenseRaw) || 0;
      }
    }

    return {
      budget: serializedBudget,
      currentExpenses: totalExpense,
    };
  } catch (error) {
    console.log("Error fetching Budget: ", error);
    throw error;
  }
}

// function to update the budget
export async function updateBudget(amount) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    await connect();
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      throw new Error("User Not Found");
    }

    const budget = await Budget.findOneAndUpdate(
      { userId: user._id }, // cndition
      { $set: { amount } }, //update budget
      {
        new: true, // return updated document
        upsert: true, // create if not exists
      }
    );

    const serializedBudget = (await serializeBudget(budget)) || null;

    revalidatePath("/dashboard");
    return {
      success: true,
      data: serializedBudget,
    };
  } catch (error) {
    console.log("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
