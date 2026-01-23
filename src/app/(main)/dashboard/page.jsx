import React, { Suspense } from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Wallet, CreditCard, PieChart } from "lucide-react";
import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";
import Link from "next/link";
import { DashboardOverview } from "./_components/transactionOverview";

async function Dashboardpage() {
  const accounts = await getUserAccounts();
  const transactions = await getDashboardData();

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
    <div className="w-full min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600">
              Welcome back,
            </h1>
            <p className="mt-1 text-sm sm:text-base text-gray-600">
              Here's your financial overview
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/transaction/create"
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base rounded-lg shadow-sm hover:shadow-md transition duration-200"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Link>
            <CreateAccountDrawer>
              <button className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md text-sm sm:text-base transition duration-200">
                <CreditCard className="h-4 w-4 text-gray-600" />
                Add Account
              </button>
            </CreateAccountDrawer>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8">
          <Card className="p-4 sm:p-5 rounded-xl sm:shadow-md border border-gray-100 bg-white">
            <CardContent className="flex items-center gap-4 sm:gap-5">
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  ₹{totalBalance.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5 rounded-xl sm:shadow-md border border-gray-100 bg-white">
            <CardContent className="flex items-center gap-4 sm:gap-5">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Accounts</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {accounts.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5 rounded-xl sm:shadow-md border border-gray-100 bg-white">
            <CardContent className="flex items-center gap-4 sm:gap-5">
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <PieChart className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget (Default)</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {budgetData?.budget ? `₹${budgetData.budget.amount}` : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress  */}
        <div className="mt-8 sm:mt-10">
          {defaultAccount && (
            <BudgetProgress
              initialBudget={budgetData?.budget}
              currentExpenses={budgetData?.currentExpenses || 0}
            />
          )}
        </div>

        {/* Overview */}
        <div className="mt-10 sm:mt-12">
          <Suspense fallback={"Loading Overview..."}>
            <DashboardOverview
              accounts={accounts}
              transactions={transactions || []}
            />
          </Suspense>
        </div>

        {/*  Accounts Grid */}
        <section className="mt-10 sm:mt-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 px-1">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight">
                Accounts
              </h2>
              <p className="text-sm text-gray-500">
                Manage your accounts and balances
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* ➕ Add New Account Card */}
            <CreateAccountDrawer>
              <Card className="cursor-pointer transition-all border border-dashed border-gray-300 bg-white rounded-xl hover:shadow-lg hover:border-green-200">
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
