export const dynamic = "force-dynamic";

import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import TransactionTable from "./_components/transaction-table";
import { BarLoader } from "react-spinners";
import { AccountChart } from "./_components/account-chart";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Wallet, Plus, Edit3 } from "lucide-react";

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
    date: doc.date ? new Date(doc.date).toISOString() : null,
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
        <div className="w-full bg-white/50 backdrop-blur-sm border border-emerald-100 p-4 sm:p-6 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          {/* left: title + type */}
          <div className="flex items-start gap-4 min-w-0">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 truncate">
                {accountData.name}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  {accountData.accountType.charAt(0).toUpperCase() +
                    accountData.accountType.slice(1).toLowerCase()}
                </span>
                <span className="text-muted-foreground">
                  {accountData._count.transactions} transactions
                </span>
              </div>
            </div>
          </div>

          {/* right: balance + actions */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Available Balance</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                ₹{parseFloat(accountData.balance).toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/transaction/create?account=${accountData._id}`}>
                <Button size="sm" className="inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="px-2 sm:px-10 mt-8">
        <Suspense fallback={<BarLoader />}>
          <AccountChart transactions={serializeTransactions(transactions)} />
        </Suspense>
      </div>
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
