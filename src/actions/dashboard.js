"use server";

import { auth } from "@clerk/nextjs/server";
import User from "@/models/userModel";
import Account from "@/models/accounts";
import { connect } from "@/dbConfig/dbConfig";
import { revalidatePath } from "next/cache";
import Transaction from "@/models/transactions";
import mongoose from "mongoose";

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
    accountId: obj.accountId?.toString(),
    balance: convertDecimalToNumber(obj.balance),
    amount: convertDecimalToNumber(obj.amount),
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
    nextRecurringDate: obj.nextRecurringDate
      ? new Date(obj.nextRecurringDate).toISOString()
      : null,
    lastProcessed: obj.lastProcessed
      ? new Date(obj.lastProcessed).toISOString()
      : null,
    date: obj.date ? new Date(obj.date).toISOString() : null,
  };
};

export async function createAccount(data) {
  // Here data will Give us all the required information about the account like balance and other things
  try {
    await connect();
    // check user exists in clerk's database or not
    const { userId } = await auth(); // Its a Feature of Clerk
    if (!userId) throw new Error("Unauthorized");
    // check user exists in our database or not
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      throw new Error("User not Found");
    }

    // convert balance of account to float before saving
    const balanceFloat = parseFloat(data.balance);

    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }

    // check that is it the User's First account (if yes then make it default)
    const existingAccounts = await Account.find({ userId: user.id });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    if (shouldBeDefault) {
      // if this account should be default , then firstly we have to make all the other accounts as not default
      await Account.updateMany(
        { userId: user.id, isDefault: true }, // find it
        { $set: { isDefault: false } } // and tjen update it
      );
    }

    // create a new Account now
    const newaccount = await Account.create({
      userId: user.id,
      name: data?.name || "newAccount",
      accountType: data.accountType,
      balance: balanceFloat,
      isDefault: shouldBeDefault,
    });

    const serializedAccount = serializeTransaction(newaccount);

    revalidatePath("/dashboard"); // This makes sure your newly created account appears immediately on the dashboard without
    // waiting for the next automatic cache update.

    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await User.findOne({ clerkUserId: userId });
  // aggregation pipelines to get all the required things
  const accounts = await Account.aggregate([
    {
      $match: { userId: user._id }, // filter by userId
    },
    {
      $sort: { createdAt: -1 }, // sort by createdAt descending
    },
    {
      $lookup: {
        from: "transactions", // collection name (lowercase + plural)
        localField: "_id", // field in Account
        foreignField: "accountId", // field in Transaction
        as: "transactions",
      },
    },
    {
      $addFields: {
        _count: {
          transactions: { $size: "$transactions" }, // count of related transactions
        },
      },
    },
    {
      $project: {
        transactions: 0, // hide transaction array if you only want the count
      },
    },
  ]);

  const serializedAccounts = accounts.map((acc) => serializeTransaction(acc)); // serialize all the accounts

  return serializedAccounts;
}

// for the Dashboard Data
export async function getDashboardData() {
  try {
    await connect();
  } catch (error) {
    throw new Error("Database Connection failed");
  }
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await User.findOne({ clerkUserId: userId });

  if (!user) {
    throw new Error("User not Found");
  }

  // Get all User Transactions
  const transactions = await Transaction.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(user._id) },
    },
    {
      $sort: { date: -1 }, // sort by date descending
    },
  ]);

  return transactions.map(serializeTransaction);
}
