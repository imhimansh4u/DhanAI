export const dynamic = "force-dynamic";

import React from "react";
import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/Categories";
import AddTransactionForm from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

const AddTransactionPage = async ({ searchParams }) => {
  const accounts = await getUserAccounts();

  const resolvedSearchParams = await searchParams;
  const editId = resolvedSearchParams?.edit;

  let initialData = null;
  if (editId) {
    const transaction = await getTransaction(editId);
    initialData = transaction;
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-green-50 to-green-100 text-black mb-0">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <header className="text-center sm:text-left mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-600">
            {editId ? "Edit" : "Add"} Transaction
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto sm:mx-0">
            {editId
              ? "Update the details of your transaction below."
              : "Quickly add a new transaction — select an account, category and fill the amount."}
          </p>
        </header>

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="max-w-3xl mx-auto">
            <AddTransactionForm
              accounts={accounts}
              categories={defaultCategories}
              editMode={!!editId}
              initialData={initialData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionPage;
