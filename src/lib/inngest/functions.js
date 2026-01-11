import { inngest } from "./client";
import Budget from "@/models/budgets";
import User from "@/models/userModel";
import Transaction from "@/models/transactions";
import Account from "@/models/accounts";
import { connect } from "@/dbConfig/dbConfig";
import { sendEmail } from "@/actions/send-email";
import Emailtempelate from "../../../emails/email";
import mongoose from "mongoose";

/**
 * parseDecimal - Converts Decimal128 (MongoDB format) to JavaScript Number
 * Handles multiple formats:
 * - { $numberDecimal: "123.45" } (MongoDB internal format)
 * - Direct numbers
 * - Strings
 * - Decimal128 object toString()
 */
function parseDecimal(val) {
  if (!val) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val);
  if (typeof val === "object") {
    if ("$numberDecimal" in val) return parseFloat(val.$numberDecimal);
    if (val.toString) {
      const num = parseFloat(val.toString());
      if (!isNaN(num)) return num;
    }
  }
  return 0;
}

// FOR CHECKING THE BUDGET ALERTS
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 Hours
  async ({ step }) => {
    try {
      await connect();
      // ensure DB is connected before running queries
    } catch (err) {
      console.error("DB connect error in checkBudgetAlerts:", err);
      // don't throw so the handler can respond; log and exit
      return;
    }
    const budgets = await step.run("fetch-budgets", async () => {
      return await Budget.aggregate([
        // Join the User details for each Budget
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" }, // each budget has one user

        // Join the default Account of that user
        {
          $lookup: {
            from: "accounts",
            let: { userId: "$user._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$isDefault", true] },
                    ],
                  },
                },
              },
              { $limit: 1 }, // only one default account per user
            ],
            as: "defaultAccount",
          },
        },
        { $unwind: "$defaultAccount" }, // remove budgets whose user has no default account
        {
          $project: {
            amount: 1,
            lastAlertSent: 1,
            "user._id": 1,
            "user.name": 1,
            "user.email": 1,
            "user.imageUrl": 1,
            "defaultAccount._id": 1,
            "defaultAccount.name": 1,
            "defaultAccount.accountType": 1,
            "defaultAccount.balance": 1,
            "defaultAccount.isDefault": 1,
          },
        },
      ]);
    });
    // if no Budget is Found
    if (!Array.isArray(budgets) || budgets.length === 0) {
      console.log("No budgets found — skipping check.");
      return;
    }

    for (const budget of budgets) {
      const defaultAccount = budget?.defaultAccount;
      if (!defaultAccount) {
        continue; // skip if no default Account
      }

      await step.run(`check-budget-${budget._id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1); // start of current Month
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1); // move to next month
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(0, 0, 0, 0);

        // Debug Logss
        console.log(budget.user.name);
        console.log(budget.defaultAccount.name);
        console.log(budget.user.email);

        // Aggregate total expenses for that user's default account
        const expenses = await Transaction.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(budget.user._id),
              accountId: new mongoose.Types.ObjectId(budget.defaultAccount._id),
              transactionType: "EXPENSE",
              createdAt: { $gte: startDate, $lt: endDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $toDouble: "$amount" } },
            },
          },
        ]);

        const totalExpenses = expenses[0]?.total || 0;
        const budgetAmount = parseDecimal(budget?.amount);
        const accountBalance = parseDecimal(budget.defaultAccount?.balance);
        const percentageUsed =
          budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

        // Debug Logs
        console.log(totalExpenses);
        console.log(budgetAmount);
        console.log(percentageUsed);

        // check that if we should send an alert or not
        if (
          percentageUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          // send the email
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: Emailtempelate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseInt(budgetAmount).toFixed(1),
                totalExpenses: parseInt(totalExpenses).toFixed(1),
                accountName: budget.defaultAccount.name,
              },
            }),
          });

          // Now update the Last Alert sent
          await Budget.findOneAndUpdate(
            { _id: budget._id },
            { lastAlertSent: new Date() }
          );
        }
      });
    }
  }
);

// Helper FUnction
function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

// To Trigger and Add Recurring Transactions

export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    try {
      await connect();
      // ensure DB is connected before running queries
    } catch (err) {
      console.error(
        "DB connect error in Triggering Recurring Transactions:",
        err
      );
      // don't throw so the handler can respond log and exit
      return;
    }
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await Transaction.aggregate([
          {
            $match: {
              isRecurring: true,
              $or: [
                { lastProcessed: { $eq: null } }, // Never processed
                { nextRecurringDate: { $lte: new Date() } }, // Due date passed
              ],
            },
          },
        ]);
      }
    );

    // 2.-> Create Events for each Transaction
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction._id.toString(),
          userId: transaction.userId.toString(),
        },
      }));

      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// Event Batching and Throtteling
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    throttle: {
      limit: 10, // Only Process 10 Transactions at once
      period: "1m", // Per 1 Minute
      key: "event.data.userId", // Per every User
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.log("Invalid event Data: ", event);
      return { error: "Missing required Event data" };
    }

    await step.run("process-transaction", async () => {
      const transaction = await Transaction.findOne({
        _id: event.data.transactionId,
        userId: event.data.userId,
      }).populate({
        path: "accountId",
        model: "Account",
      }); // include the related account details

      if (!transaction || !isTransactionDue(transaction)) return;

      // Validate transaction has required fields
      if (!transaction.transactionType || !transaction.amount) {
        console.error("Transaction missing required fields:", transaction._id);
        return;
      }

      const session = await mongoose.startSession();

      try {
        await session.withTransaction(async () => {
          // Parse Decimal128 amount properly
          const parsedAmount = parseDecimal(transaction.amount);

          console.log(
            `Processing recurring transaction: ${transaction._id}, Amount: ${parsedAmount}, Type: ${transaction.transactionType}`
          );

          // 1️.-> Create new transaction
          const newTransaction = await Transaction.create(
            [
              {
                transactionType: transaction.transactionType,
                amount: parsedAmount,
                description: `${transaction.description} (Recurring)`,
                date: new Date(),
                category: transaction.category,
                userId: transaction.userId,
                accountId: transaction.accountId,
                isRecurring: false,
              },
            ],
            { session }
          );

          console.log(`✅ New transaction created: ${newTransaction[0]._id}`);

          // 2️.-> Update account balance
          const balanceChange =
            transaction.transactionType === "EXPENSE"
              ? -parsedAmount
              : parsedAmount;

          await Account.updateOne(
            { _id: transaction.accountId },
            { $inc: { balance: balanceChange } },
            { session }
          );

          // 3️.-> Update last processed & next recurring date
          const nextDue = calculateNextRecurringDate(
            new Date(),
            transaction.recurringInterval
          );

          await Transaction.updateOne(
            { _id: transaction._id },
            {
              $set: {
                lastProcessed: new Date(),
                nextRecurringDate: nextDue,
              },
            },
            { session }
          );

          console.log(
            `✅ Updated parent transaction: ${transaction._id}, Next due: ${nextDue}`
          );
        });

        await session.endSession();
      } catch (error) {
        console.error("Error processing recurring transaction:", error);
        await session.endSession();
        throw error;
      }
    });

    function isTransactionDue(transaction) {
      // If no lastProcessed date , transaction is due
      if (!transaction.lastProcessed) {
        return true;
      }

      // Normalize dates to avoid time zone issues
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const nextDue = new Date(transaction.nextRecurringDate);
      nextDue.setUTCHours(0, 0, 0, 0);

      // Compare with nextDue date
      return nextDue <= today;
    }
  }
);

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
