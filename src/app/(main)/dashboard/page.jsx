import React from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet, CreditCard, PieChart } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";
import Link from "next/link";

async function Dashboardpage() {
  const accounts = await getUserAccounts();

  const defaultAccount = accounts?.find((acc) => acc.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount._id);
  }

  // Showing Total Balance
  const totalBalance = accounts.reduce((sum, a) => {
    const val = a?.balance ? parseFloat(a.balance.toString()) : 0;
    return sum + val;
  }, 0);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">
              Welcome back,
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Here's your financial overview
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/transaction/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Link>
            <CreateAccountDrawer>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
                <CreditCard className="h-4 w-4 text-gray-600" />
                Add Account
              </button>
            </CreateAccountDrawer>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          <Card className="p-4 sm:rounded-2xl rounded-none sm:shadow-md shadow-none border border-gray-100">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalBalance.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:rounded-2xl rounded-none sm:shadow-md shadow-none border border-gray-100">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Accounts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accounts.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:rounded-2xl rounded-none sm:shadow-md shadow-none border border-gray-100">
            <CardContent className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <PieChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget (Default)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {budgetData?.budget ? `₹${budgetData.budget.amount}` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress  */}
        <div className="mt-6">
          {defaultAccount && (
            <BudgetProgress
              initialBudget={budgetData?.budget}
              currentExpenses={budgetData?.currentExpenses || 0}
            />
          )}
        </div>

        {/*  Accounts Grid */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight">
              Accounts
            </h2>
            <p className="text-sm text-gray-500">
              Manage your accounts and balances
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ➕ Add New Account Card */}
            <CreateAccountDrawer>
              <Card className="cursor-pointer transition-shadow border border-dashed border-gray-200 bg-white sm:rounded-xl rounded-none sm:hover:shadow-lg hover:shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-10 text-gray-600">
                  <div className="p-3 rounded-full bg-green-100 text-green-600 mb-3">
                    <Plus size={28} strokeWidth={2.5} />
                  </div>
                  <p className="text-base font-medium">Add New Account</p>
                </CardContent>
              </Card>
            </CreateAccountDrawer>

            {accounts.length > 0 &&
              accounts?.map((account) => {
                return <AccountCard key={account._id} account={account} />;
              })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboardpage;
