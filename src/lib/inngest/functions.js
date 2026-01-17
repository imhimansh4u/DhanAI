import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Budget from "@/models/budgets";
import User from "@/models/userModel";
import Transaction from "@/models/transactions";
import Account from "@/models/accounts";
import { connect } from "@/dbConfig/dbConfig";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "../../../emails/email";
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
            react: EmailTemplate({
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

//  1. Generate AI Insights
export async function generateFinancialInsights(stats, month) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not set — returning fallback insights");
    return [
      "Your highest expense category this month might need attention. DhanAI can help you analyze it better.",
      "Consider setting up a monthly budget with DhanAI to improve financial management.",
      "Track your recurring expenses using DhanAI to discover hidden savings opportunities.",
    ];
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model =
    genAI.getGenerativeModel?.({ model: "gemini-2.5-flash" }) || genAI;

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.
    My web app name is DhanAI — mention it naturally while giving suggestions.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    // Try multiple SDK call patterns to be resilient to version differences
    let result;

    if (typeof model.generateContent === "function") {
      result = await model.generateContent(prompt);
    } else if (typeof genAI.generate === "function") {
      result = await genAI.generate({ model: "gemini-2.5-flash", prompt });
    } else if (typeof model.generate === "function") {
      result = await model.generate({ prompt });
    } else {
      throw new Error(
        "No supported generate method found on GoogleGenerativeAI client"
      );
    }

    // Attempt to extract text from a few known response shapes
    let text = null;
    try {
      if (result?.response?.text) text = result.response.text();
      else if (result?.output?.[0]?.content?.[0]?.text)
        text = result.output[0].content[0].text;
      else if (typeof result === "string") text = result;
      else if (result?.candidates?.[0]?.content)
        text = result.candidates[0].content;
    } catch (e) {
      // ignore internal extraction errors
    }

    if (!text) {
      console.error("generateFinancialInsights: unexpected result shape", {
        result,
      });
      throw new Error("Empty response from Gemini");
    }

    const cleanedText = String(text)
      .replace(/```(?:json)?\n?/g, "")
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (jsonErr) {
      // If the model didn't return JSON, try to extract lines as fallback
      console.warn(
        "Could not parse JSON from Gemini — returning line-split fallback",
        { cleanedText }
      );
      return cleanedText
        .split(/\n+/)
        .map((l) => l.replace(/^[0-9\.\-\)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention. DhanAI can help you analyze it better.",
      "Consider setting up a monthly budget with DhanAI to improve financial management.",
      "Track your recurring expenses using DhanAI to discover hidden savings opportunities.",
    ];
  }
}

//  2. Generate Monthly Reports
export const generateMonthlyReports = inngest.createFunction(
  { id: "generate-monthly-reports", name: "Generate Monthly Reports" },
  { cron: "0 0 1 * *" }, // run on 1st of every month at 00:00
  async ({ step }) => {
    try {
      await connect(); // ensure DB connection

      const users = await step.run("fetch-users", async () => {
        return await User.find();
      });

      for (const user of users) {
        await step.run(`user-${user._id}-report`, async () => {
          const accounts = await Account.find({ userId: user._id });

          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);
          const monthName = lastMonth.toLocaleString("default", {
            month: "long",
          });

          const stats = await getMonthlyStats(user._id, lastMonth);
          const insights = await generateFinancialInsights(stats, monthName);

          await sendEmail({
            to: user.email,
            subject: `Your Monthly Financial Report - ${monthName}`,
            react: EmailTemplate({
              userName: user.name,
              type: "monthly-report",
              data: {
                stats,
                month: monthName,
                insights,
                accounts,
              },
            }),
          });
        });
      }

      return { processed: users.length };
    } catch (error) {
      console.error("Error generating monthly reports:", error);
      throw error;
    }
  }
);

//  3. Get Monthly Stats
export async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 1); // exclusive

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalExpenses: {
                $sum: {
                  $cond: [
                    { $eq: ["$transactionType", "EXPENSE"] },
                    { $toDouble: "$amount" },
                    0,
                  ],
                },
              },
              totalIncome: {
                $sum: {
                  $cond: [
                    { $eq: ["$transactionType", "INCOME"] },
                    { $toDouble: "$amount" },
                    0,
                  ],
                },
              },
              transactionCount: { $sum: 1 },
            },
          },
        ],
        byCategory: [
          { $match: { transactionType: "EXPENSE" } },
          {
            $group: {
              _id: "$category",
              amount: { $sum: { $toDouble: "$amount" } },
            },
          },
        ],
      },
    },
    {
      $project: {
        totals: { $arrayElemAt: ["$totals", 0] },
        byCategory: 1,
      },
    },
  ];

  const res = await Transaction.aggregate(pipeline);
  const totals = res[0]?.totals || {
    totalExpenses: 0,
    totalIncome: 0,
    transactionCount: 0,
  };
  const byCategoryArray = res[0]?.byCategory || [];

  const byCategory = byCategoryArray.reduce((acc, cur) => {
    acc[cur._id || "Uncategorized"] = cur.amount;
    return acc;
  }, {});

  return {
    totalExpenses: totals.totalExpenses || 0,
    totalIncome: totals.totalIncome || 0,
    byCategory,
    transactionCount: totals.transactionCount || 0,
  };
}
