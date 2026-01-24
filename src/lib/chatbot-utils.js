import User from "@/models/userModel";
import Account from "@/models/accounts";
import Transaction from "@/models/transactions";
import Budget from "@/models/budgets";

/**
 * Fetch user's financial data for chatbot context (Very Important , bcs we Cannot Provide Raw mongodb data to the LLm Model)
 */
export async function getUserFinancialContext(userId) {
  try {
    // Fetch user details
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Fetch all accounts
    const accounts = await Account.find({ userId });

    // Calculate account balances
    const accountSummary = accounts.map((acc) => ({
      name: acc.name,
      type: acc.accountType,
      balance: acc.balance?.toString() || "0",
      isDefault: acc.isDefault,
    }));

    const totalBalance = accounts.reduce((sum, acc) => {
      // sum is initially 0 and acc is the current accumulator object
      return sum + parseFloat(acc.balance?.toString() || 0);
    }, 0);

    // Fetch recent transactions (last 30 days) here
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = await Transaction.find({
      userId,
      date: { $gte: thirtyDaysAgo },
    })
      .sort({ date: -1 })
      .limit(50);

    // Calculate spending by category
    const expensesByCategory = {};
    const incomeByCategory = {};
    const expensesByAccount = {};
    const incomeByAccount = {};
    let totalIncome = 0;
    let totalExpense = 0;

    recentTransactions.forEach((tx) => {
      const amount = parseFloat(tx.amount?.toString() || 0);
      const accountId = tx.accountId?.toString() || "Unknown";

      if (tx.transactionType === "INCOME") {
        totalIncome += amount;
        incomeByCategory[tx.category] =
          (incomeByCategory[tx.category] || 0) + amount;
        incomeByAccount[accountId] = (incomeByAccount[accountId] || 0) + amount;
      } else {
        totalExpense += amount;
        expensesByCategory[tx.category] =
          (expensesByCategory[tx.category] || 0) + amount;
        expensesByAccount[accountId] = (expensesByAccount[accountId] || 0) + amount;
      }
    });

    // Get all-time stats
    const allTransactions = await Transaction.find({ userId });
    let totalAllTimeIncome = 0;
    let totalAllTimeExpense = 0;

    allTransactions.forEach((tx) => {
      const amount = parseFloat(tx.amount?.toString() || 0);
      if (tx.transactionType === "INCOME") {
        totalAllTimeIncome += amount;
      } else {
        totalAllTimeExpense += amount;
      }
    });

    // Fetch monthly budget data
    const budget = await Budget.findOne({ userId });
    let budgetAmount = 0;
    let budgetUtilization = 0;
    let budgetRemaining = 0;
    let isBudgetExceeded = false;

    if (budget) {
      budgetAmount = parseFloat(budget.amount?.toString() || 0);
      budgetUtilization = budgetAmount > 0 ? ((totalExpense / budgetAmount) * 100).toFixed(2) : 0;
      budgetRemaining = budgetAmount - totalExpense;
      isBudgetExceeded = budgetRemaining < 0;
    }

    return {
      userName: user.name,
      email: user.email,
      accountSummary,
      totalBalance: totalBalance.toFixed(2),
      last30Days: {
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        netCashFlow: (totalIncome - totalExpense).toFixed(2),
        expensesByCategory,
        incomeByCategory,
        expensesByAccount: Object.fromEntries(
          Object.entries(expensesByAccount).map(([accId, amount]) => {
            const account = accounts.find((a) => a._id.toString() === accId);
            return [account?.name || accId, amount.toFixed(2)];
          })
        ),
        incomeByAccount: Object.fromEntries(
          Object.entries(incomeByAccount).map(([accId, amount]) => {
            const account = accounts.find((a) => a._id.toString() === accId);
            return [account?.name || accId, amount.toFixed(2)];
          })
        ),
        transactionCount: recentTransactions.length,
      },
      monthlyBudget: {
        budgetLimit: budgetAmount.toFixed(2),
        monthlySpending: totalExpense.toFixed(2),
        budgetUtilization: budgetUtilization + "%",
        budgetRemaining: budgetRemaining.toFixed(2),
        isBudgetExceeded: isBudgetExceeded,
        status: isBudgetExceeded ? "EXCEEDED" : budgetUtilization >= 80 ? "WARNING" : "ON_TRACK",
      },
      allTimeStats: {
        totalIncome: totalAllTimeIncome.toFixed(2),
        totalExpense: totalAllTimeExpense.toFixed(2),
        netPosition: (totalAllTimeIncome - totalAllTimeExpense).toFixed(2),
        totalTransactions: allTransactions.length,
      },
      recentTransactions: recentTransactions.map((tx) => ({
        date: tx.date ? new Date(tx.date).toLocaleDateString() : "N/A",
        type: tx.transactionType,
        amount: tx.amount?.toString() || "0",
        category: tx.category || "Other",
        description: tx.description,
        isRecurring: tx.isRecurring,
      })),
    };
  } catch (error) {
    console.error("Error fetching financial context:", error);
    throw error;
  }
}

// See , Everytime the user has some query, I Have to Produce a System Prompt which is to be fed to Gemini AI , In order to
// Get The Stats of the Financial Record , and this part is Generating the same Thing , We will Provide it the whole Financial
// data in a systematic manner on which it will Work
export function createSystemPrompt(financialData) {
  const accountWiseExpenses = Object.entries(financialData.last30Days.expensesByAccount)
    .map(([acc, amt]) => `${acc}: ₹${amt}`)
    .join(", ");
  
  const accountWiseIncome = Object.entries(financialData.last30Days.incomeByAccount)
    .map(([acc, amt]) => `${acc}: ₹${amt}`)
    .join(", ");

  return `You are a knowledgeable personal finance assistant AI named DhanAI. You have access to the user's financial data and should help them understand their finances, answer questions, and provide insights.

USER FINANCIAL PROFILE:
- Name: ${financialData.userName}
- Total Balance: ₹${financialData.totalBalance}
- Active Accounts: ${financialData.accountSummary.map((a) => `${a.name} (${a.type}): ₹${a.balance}`).join(", ")}

MONTHLY BUDGET:
- Budget Limit: ₹${financialData.monthlyBudget.budgetLimit}
- Current Monthly Spending: ₹${financialData.monthlyBudget.monthlySpending}
- Budget Utilization: ${financialData.monthlyBudget.budgetUtilization}
- Budget Remaining: ₹${financialData.monthlyBudget.budgetRemaining}
- Budget Status: ${financialData.monthlyBudget.status}
${financialData.monthlyBudget.isBudgetExceeded ? `⚠️ ALERT: Budget EXCEEDED by ₹${Math.abs(parseFloat(financialData.monthlyBudget.budgetRemaining)).toFixed(2)}` : ""}

LAST 30 DAYS:
- Total Income: ₹${financialData.last30Days.totalIncome}
- Total Expense: ₹${financialData.last30Days.totalExpense}
- Net Cash Flow: ₹${financialData.last30Days.netCashFlow}
- Transactions: ${financialData.last30Days.transactionCount}

ACCOUNT-WISE BREAKDOWN (Last 30 Days):
- Income by Account: ${accountWiseIncome || "No income recorded"}
- Expenses by Account: ${accountWiseExpenses || "No expenses recorded"}

TOP SPENDING CATEGORIES (Last 30 Days):
${Object.entries(financialData.last30Days.expensesByCategory)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([cat, amt]) => `- ${cat}: ₹${amt.toFixed(2)}`)
  .join("\n") || "No expenses recorded"}

ALL-TIME STATISTICS:
- Total Income: ₹${financialData.allTimeStats.totalIncome}
- Total Expense: ₹${financialData.allTimeStats.totalExpense}
- Net Position: ₹${financialData.allTimeStats.netPosition}
- Total Transactions: ${financialData.allTimeStats.totalTransactions}

RECENT TRANSACTIONS:
${financialData.recentTransactions
  .slice(0, 10)
  .map(
    (tx) =>
      ` ${tx.date}: ${tx.type} of ₹${tx.amount} in ${tx.category} - ${tx.description || "N/A"}`,
  )
  .join("\n")}

You are helpful, friendly, and provide data-driven insights. When answering:
1. Use the actual data provided above
2. Give specific numbers and percentages
3. Provide actionable advice for improving finances
4. Help users understand their budget status and suggest ways to stay within budget
5. Answer questions about spending patterns, budgets, and financial health by account
6. Alert user if they are close to or exceeding their budget limit
7. Be conversational and supportive
8. Keep the conversation looking normal, don't include markdown symbols like **, it looks annoying
9. Please Give Modern Reply with highlighted bold texts where important , proper headlines
Always respond in a clear, concise manner.`}
