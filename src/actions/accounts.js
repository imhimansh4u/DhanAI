"use server";
import mongoose from "mongoose";
import { connect } from "@/dbConfig/dbConfig";
import Account from "@/models/accounts";
import User from "@/models/userModel";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import Transaction from "@/models/transactions";

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
    // Include transaction-specific date fields and convert to ISO strings
    date: obj.date ? new Date(obj.date).toISOString() : null,
    nextRecurringDate: obj.nextRecurringDate
      ? new Date(obj.nextRecurringDate).toISOString()
      : null,
    lastProcessed: obj.lastProcessed
      ? new Date(obj.lastProcessed).toISOString()
      : null,
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
      { $set: { isDefault: false } },
    );

    // Now update that account which needs to be updated
    const account = await Account.findByIdAndUpdate(
      accountId,
      { $set: { isDefault: true } },
      { new: true }, // returns updated document
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
    return notFound(); // It means that if it is not valid accountId then simply navigate to 404 page
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

// To delete or bulk delete trnasactions
export async function bulkDeleteTransactions(transactionIds) {
  try {
    await connect();
    const session = await mongoose.startSession(); // a session will ensure either all the operations inside it  succeed , or all will fail
    
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      throw new Error("User not Found");
    }

    const transactions = await Transaction.find({
      _id: { $in: transactionIds },
      userId: user._id,
    });

    // Now delete transactions WITHOUT updating account balance
    await session.withTransaction(async () => {
      // Delete all the matching transactions
      await Transaction.deleteMany(
        {
          _id: { $in: transactionIds },
          userId: user._id,
        },
        { session }, // attach session (kyuki iske bina seession ke andr include nhi rhega)
      );
    });

    console.log("Transactions Deleted Successfully");

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Delete Account and all its transactions
export async function deleteAccount(accountId) {
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

    // Find the account to delete
    const account = await Account.findOne({
      _id: accountId,
      userId: user._id,
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Check if this is the only account (can't delete if it's the only one)
    const accountCount = await Account.countDocuments({ userId: user._id });
    

    // Start a session for atomic deletion
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete all transactions associated with this account
        await Transaction.deleteMany(
          { accountId: accountId, userId: user._id },
          { session },
        );

        // Delete the account itself
        await Account.deleteOne(
          { _id: accountId, userId: user._id },
          { session },
        );
      });

      console.log(
        `Account ${accountId} and its transactions deleted successfully`,
      );

      revalidatePath("/dashboard");
      revalidatePath("/account/[id]");

      return {
        success: true,
        message: "Account and its transactions deleted successfully",
      };
    } finally {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    return { success: false, error: error.message };
  }
}
/**
 * What "use server" Does

"use server" marks a file or a function as a server action.

It tells Next.js:

“This function should run only on the server, not in the browser.”

It’s not required for normal server components (like page.jsx, layout.jsx, etc.).
It’s only required for:

Server Actions (functions you plan to call directly from the client or form actions).
 */
