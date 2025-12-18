import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import TransactionTable from "./_components/transaction-table";
import { BarLoader } from "react-spinners";

function serializeTransactions(docs) {
  if (!docs) return [];

  const serializeOne = (doc) => ({
    _id: doc._id?.toString(),
    transactionType: doc.transactionType,
    userId: doc.userId?.toString(),
    amount: parseFloat(doc.amount?.toString() || 0),
    accountId: doc.accountId?.toString(),
    description: doc.description,
    category: doc.category,
    receiptUrl: doc.receiptUrl,
    isRecurring: doc.isRecurring,
    recurringInterval: doc.recurringInterval,
    nextRecurringDate: doc.nextRecurringDate
      ? new Date(doc.nextRecurringDate).toISOString()
      : null,
    lastProcessed: doc.lastProcessed
      ? new Date(doc.lastProcessed).toISOString()
      : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  });

  if (Array.isArray(docs)) return docs.map(serializeOne);
  return serializeOne(docs);
}

// This is for the Account Page
const AccountPage = async ({ params }) => {
  // NOTE-> In the app router next is a promise
  const resolvedParams = await params;
  const accountData = await getAccountWithTransactions(resolvedParams.id);
  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="w-full mt-10 px-4 sm:px-10">
        <div
          className="
        w-full 
        bg-gradient-to-r from-emerald-50 via-white to-emerald-50
        text-gray-800 
        border border-emerald-100
        p-6 sm:p-8 
        flex flex-col sm:flex-row 
        justify-between 
        items-start sm:items-center 
        gap-4
        shadow-sm
      "
        >
          {/* Left Section */}
          <div className="w-full sm:w-auto text-center sm:text-left">
            <h1 className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-sky-600 via-blue-500 to-cyan-600 bg-clip-text text-transparent drop-shadow-md">
              {accountData.name}
            </h1>
            <p className="text-sky-700 mt-2 text-base sm:text-lg font-medium">
              {accountData.accountType.charAt(0).toUpperCase() +
                accountData.accountType.slice(1).toLowerCase()}{" "}
              Account
            </p>
          </div>

          {/* Right Section */}
          <div className="w-full sm:w-auto text-center sm:text-right">
            <p className="text-lg sm:text-xl text-gray-800 font-semibold">
              Balance:{" "}
              <span className="text-sky-700 font-extrabold">
                ₹{parseFloat(accountData.balance).toFixed(2)}
              </span>
            </p>
            <p className="mt-1 sm:mt-2 text-sm text-gray-600">
              {accountData._count.transactions} Transactions
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}

      {/* Transaction Table */}
      <div className="px-2 sm:px-10 mt-8">
        <Suspense fallback={<BarLoader />}>
          <TransactionTable
            transactions={serializeTransactions(transactions)}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default AccountPage;
