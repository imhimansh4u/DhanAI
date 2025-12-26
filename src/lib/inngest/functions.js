// import { inngest } from "./client";
// import Budget from "@/models/budgets";
// import User from "@/models/userModel";
// import Transaction from "@/models/transactions";
// import Account from "@/models/accounts";
// import { connect } from "@/dbConfig/dbConfig";
// import { sendEmail } from "@/actions/send-email";
// import Emailtempelate from "../../../emails/email";

// function parseBudgetAmount(val) {
//   if (val == null) return 0;
//   if (typeof val === "number") return val;
//   if (typeof val === "string") return parseFloat(val) || 0;
//   try {
//     // Mongoose Decimal128 from .lean() may appear as { $numberDecimal: ".." }
//     if (typeof val === "object") {
//       if ("$numberDecimal" in val) return parseFloat(val.$numberDecimal) || 0;
//       if (val.toString && typeof val.toString === "function") {
//         const s = val.toString();
//         const n = parseFloat(s);
//         if (!isNaN(n)) return n;
//       }
//     }
//   } catch (e) {
//     return 0;
//   }
//   return 0;
// }

// export const checkBudgetAlerts = inngest.createFunction(
//   { name: "Check Budget Alerts" },
//   { cron: "0 */6 * * *" }, // Every 6 hours
//   async ({ step }) => {
//     try {
//       await connect();
//       // ensure DB is connected before running queries
//     } catch (err) {
//       console.error("DB connect error in checkBudgetAlerts:", err);
//       // don't throw so the handler can respond; log and exit
//       return;
//     }
//     // Fetch all budgets (we'll resolve user and account per budget)
//     const budgets = await step.run("fetch-budgets", async () => {
//       return await Budget.find().lean();
//     });

//     // traverse through each budget
//     for (const budget of budgets) {
//       try {
//         const user = await User.findById(budget.userId).lean();
//         const defaultAccount = await Account.findOne({
//           userId: budget.userId,
//           isDefault: true,
//         }).lean();
//         if (!defaultAccount) continue; // Skip if no default account is found

//         await step.run(`check-budget-${budget._id}`, async () => {
//           const startDate = new Date();
//           startDate.setDate(1); // Start of current month
//           startDate.setHours(0, 0, 0, 0);
//           const endDate = new Date(startDate);
//           endDate.setMonth(endDate.getMonth() + 1); // move to next month

//           // Aggregate total expenses for that user's default account
//           const expenses = await Transaction.aggregate([
//             {
//               $match: {
//                 userId: budget.userId,
//                 accountId: defaultAccount._id,
//                 transactionType: "EXPENSE",
//                 createdAt: { $gte: startDate, $lt: endDate },
//               },
//             },
//             {
//               $group: {
//                 _id: null,
//                 total: { $sum: { $toDouble: "$amount" } },
//               },
//             },
//           ]);

//           // aggregation result used below

//           let totalExpenses;
//           if (expenses.length > 0 && expenses[0].total != null) {
//             totalExpenses = expenses[0].total;
//           } else {
//             // Fallback: fetch matching transactions and sum amounts in JS (Only if aggregation Pipeline fails)
//             try {
//               const txs = await Transaction.find({
//                 userId: budget.userId,
//                 accountId: defaultAccount._id,
//                 transactionType: "EXPENSE",
//                 createdAt: { $gte: startDate, $lt: endDate },
//               }).lean();
//               const sum = txs.reduce((acc, t) => {
//                 const v = t.amount ? parseFloat(t.amount.toString()) : 0;
//                 return acc + v;
//               }, 0);
//               totalExpenses = sum;
//             } catch (fbErr) {
//               console.error("Fallback sum failed:", fbErr);
//               totalExpenses = 0;
//             }
//           }
//           const budgetAmount = parseBudgetAmount(budget.amount);
//           const percentageUsed =
//             budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

//           //  Check if we should send alert
//           if (
//             percentageUsed >= 80 && // Default threshold of 80%
//             (!budget.lastAlertSent ||
//               isNewMonth(new Date(budget.lastAlertSent), new Date()))
//           ) {
//             // send the Mail
//             await sendEmail({
//               to: user.email,
//               subject: `Budget Alert for ${defaultAccount.name}`,
//               react: Emailtempelate({
//                 userName: user.name,
//                 type: "budget-alert",
//                 data: {
//                   percentageUsed,
//                   budgetAmount: parseInt(budgetAmount).toFixed(1),
//                   totalExpenses: parseInt(totalExpenses).toFixed(1),
//                   accountName: defaultAccount.name,
//                 },
//               }),
//             });
//             //  Update last alert date
//             try {
//               const updated = await Budget.findByIdAndUpdate(
//                 budget._id,
//                 { lastAlertSent: new Date() },
//                 { new: true }
//               );
//               if (!updated) {
//                 console.error(
//                   `Budget ${budget._id} not found when updating lastAlertSent`
//                 );
//               } else {
//                 console.log(
//                   `Updated budget ${budget._id} lastAlertSent ->`,
//                   updated.lastAlertSent
//                 );
//               }
//             } catch (error) {
//               console.error(`Failed updating budget ${budget._id}:`, error);
//             }
//           }
//         });
//       } catch (err) {
//         console.error(`Error checking budget ${budget._id}:`, err);
//         // continue to next budget
//         continue;
//       }
//     }
//   }
// );

// // to check if a new month has started
// function isNewMonth(lastAlertDate, currentDate) {
//   return (
//     lastAlertDate.getMonth() !== currentDate.getMonth() ||
//     lastAlertDate.getFullYear() !== currentDate.getFullYear()
//   );
// }

import { inngest } from "./client";
import Budget from "@/models/budgets";
import User from "@/models/userModel";
import Transaction from "@/models/transactions";
import Account from "@/models/accounts";
import { connect } from "@/dbConfig/dbConfig";
import { sendEmail } from "@/actions/send-email";
import Emailtempelate from "../../../emails/email";
import mongoose from "mongoose";

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
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

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

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}
