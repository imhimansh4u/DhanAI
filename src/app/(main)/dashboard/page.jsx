import React from "react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/account-card";

async function Dashboardpage() {

  const accounts = await getUserAccounts();  

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-green-50 px-6 py-10">
    

      {/* Budget Progress Section (placeholder for now) */}
      

      {/*  Overview Section (placeholder for now) */}
    

      {/*  Accounts Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-700">Accounts</h2>
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

          {accounts.length>0 && accounts?.map((account)=>{
            return <AccountCard key={account._id} account={account}/>
          })}
        </div>
      </section>
    </div>
  );
}

export default Dashboardpage;
