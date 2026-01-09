import React from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/Categories";
import AddTransactionForm from "../_components/transaction-form";

const AddTransactionPage = async () => {
  const accounts = await getUserAccounts();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 text-black mb-0">
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-0">
        <h1
          className="text-3xl sm:text-5xl font-extrabold mb-4 
          text-transparent bg-clip-text whitespace-nowrap
          bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 
          tracking-tight text-center"
        >
          Add Transactions
        </h1>

        <div className="mt-3">
          <AddTransactionForm
            accounts={accounts}
            categories={defaultCategories}
          />
        </div>
      </div>
    </div>
  );
};

export default AddTransactionPage;
