import React from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";

async function Dashboardpage() {

  const accounts = await getUserAccounts();  

  const defaultAccount = accounts?.find((acc)  => acc.isDefault);

  let budgetData = null;
  if(defaultAccount){
    budgetData = await getCurrentBudget(defaultAccount._id);
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-green-50 px-6 py-10">
      {/* Budget Progress  */}
      {defaultAccount && (
        <BudgetProgress
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.currentExpenses || 0}
        />
      )}

      {/*  Overview Section */}

      {/*  Accounts Grid */}
      <section>
        <div className="flex items-center justify-between mt-8 mb-8 px-4 sm:px-6 lg:px-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 tracking-tight">
            Accounts
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* ➕ Add New Account Card */}
          <CreateAccountDrawer>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 bg-white">
              <CardContent className="flex flex-col items-center justify-center py-10 text-gray-600">
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
  );
}

export default Dashboardpage;
