"use server";
import mongoose from "mongoose";
import { connect } from "@/dbConfig/dbConfig";
import Account from "@/models/accounts";
import User from "@/models/userModel";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import React from "react";
import { success } from "zod";
import { notFound } from "next/navigation";

const serializeTransaction = (doc) => {
  // Handle both Mongoose documents and plain JS objects
  const obj =
    typeof doc.toObject === "function"
      ? doc.toObject({ versionKey: false })
      : doc;

  // helper for Decimal128 → number conversion
  const convertDecimalToNumber = (val) => {
    if (val && typeof val === "object" && val._bsontype === "Decimal128") {
      return parseFloat(val.toString());
    }
    return val;
  };

  return {
    ...obj,
    _id: obj._id?.toString(),
    userId: obj.userId?.toString(),
    balance: convertDecimalToNumber(obj.balance),
    amount: convertDecimalToNumber(obj.amount),
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
  };
};

// This function helps us to Update the Default Account
export async function updateDefaultAccount(accountId) {
  try {
    await connect();
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      throw new Error("User not Found");
    }

    // firstly sare accounts ko isDefault false mark kr do
    await Account.updateMany(
      { userId: user._id },
      { $set: { isDefault: false } }
    );

    // Now update that account which needs to be updated
    const account = await Account.findByIdAndUpdate(
      accountId,
      { $set: { isDefault: true } },
      { new: true } // returns updated document
    );

    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransactions(accountId) {
  await connect();
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const user = await User.findOne({ clerkUserId: userId });

  if (!user) {
    throw new Error("User not Found");
  }

  if (!mongoose.Types.ObjectId.isValid(accountId)) {
    return notFound();       // It means that if it is not valid accountId then simply navigate to 404 page 
  }


  const account = await Account.aggregate([
    // This will give the account details , with all its transaction details , with all transaction counts
    {
      $match: {
        _id: new mongoose.Types.ObjectId(accountId),
        userId: user._id,
      },
    },

    {
      $lookup: {
        from: "transactions",
        localField: "_id",
        foreignField: "accountId",
        as: "transactions",
      },
    },

    {
      $addFields: {
        transactions: {
          $sortArray: { input: "$transactions", sortBy: { date: -1 } },
        },
      },
    },

    {
      $addFields: {
        _count: { transactions: { $size: "$transactions" } },
      },
    },

    {
      $project: {
        name: 1,
        accountType: 1,
        balance: 1,
        isDefault: 1,
        transactions: 1,
        _count: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!account.length) {
    return null;
  }

  return {
    ...serializeTransaction(account[0]),
    transactions: account[0].transactions.map(serializeTransaction),
  };
}

// NOTES->
/**
 * What "use server" Does

"use server" marks a file or a function as a server action.

It tells Next.js:

“This function should run only on the server, not in the browser.”

It’s not required for normal server components (like page.jsx, layout.jsx, etc.).
It’s only required for:

Server Actions (functions you plan to call directly from the client or form actions).
 */
