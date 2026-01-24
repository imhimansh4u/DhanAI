"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, ArrowDownRight, Wallet, Trash2 } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount, deleteAccount } from "@/actions/accounts";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AccountCard = ({ account }) => {
  const { name, accountType, balance, _id, isDefault } = account;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { loading: updateDefaultLoading, fn: updateDefaultFn } =
    useFetch(updateDefaultAccount);
  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleteResult,
  } = useFetch(deleteAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }
    await updateDefaultFn(_id);
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    await deleteFn(_id);
  };

  useEffect(() => {
    if (deleteResult?.success) {
      toast.success("Account deleted successfully");
      setShowDeleteDialog(false);
    } else if (deleteResult?.error) {
      toast.error(deleteResult.error);
    }
  }, [deleteResult]);

  return (
    <>
      {/* Card */}
      <Link href={`/account/${_id}`} className="block relative">
        <Card className="group cursor-pointer transition-all border border-gray-200 bg-white dark:bg-slate-900 sm:rounded-xl rounded-md p-3 sm:p-4 hover:shadow-lg relative overflow-hidden w-full">
          {/* Header */}
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-md bg-gradient-to-br from-green-50 to-green-100 text-green-600 flex-shrink-0">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {name}
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {accountType
                    ? `${accountType.charAt(0)}${accountType
                        .slice(1)
                        .toLowerCase()}`
                    : "Account"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2">
              {isDefault && (
                <span className="hidden sm:inline-block text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Default
                </span>
              )}
              <Switch
                checked={isDefault}
                onClick={handleDefaultChange}
                disabled={updateDefaultLoading}
              />
            </div>
          </CardHeader>

          {/* Balance Section */}
          <CardContent className="py-3 sm:py-4 text-left">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              ₹{parseFloat(balance || 0).toFixed(2)}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Available Balance
            </p>
          </CardContent>

          {/* Footer */}
          <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pt-3 border-t border-gray-100 dark:border-slate-800 relative">
            {/* Actions */}
            

            {/* Delete Button */}
            <button
              onClick={handleDeleteClick}
              disabled={deleteLoading}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white p-2 sm:p-2.5 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
              title="Delete account"
            >
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </CardFooter>
        </Card>
      </Link>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 max-w-md w-[90%] rounded-xl shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 dark:text-red-400">
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
              Are you sure you want to delete <strong>{name}</strong>? This
              action cannot be undone.
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-400">
                ⚠️ <strong>Warning:</strong> All transactions associated with
                this account will also be deleted permanently.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <AlertDialogCancel className="sm:w-auto w-full border border-gray-300 dark:border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="sm:w-auto w-full bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400"
            >
              {deleteLoading ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountCard;
