"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { updateDefaultAccount } from "@/actions/accounts";
import { toast } from "sonner";

const AccountCard = ({ account }) => {
  const { name, accountType, balance, _id, isDefault } = account;

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    if (isDefault) {
      toast.warning("You need atleast 1 default account");
      return;
    }

    await updateDefaultFn(_id);
  };

  return (
    <Link href={`/account/${_id}`} className="block">
      <Card className="group cursor-pointer transition-all border border-gray-200 bg-white sm:rounded-xl rounded-none p-3 sm:p-3 hover:shadow-md sm:hover:shadow-md">
        <CardHeader className="flex items-start justify-between gap-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gradient-to-br from-green-50 to-green-100 text-green-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base font-semibold text-gray-800 truncate">
                {name}
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {accountType
                  ? `${accountType.charAt(0)}${accountType
                      .slice(1)
                      .toLowerCase()}`
                  : "Account"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
              {isDefault ? "Default" : ""}
            </span>
            <Switch
              checked={isDefault}
              onClick={handleDefaultChange}
              disabled={updateDefaultLoading}
            />
          </div>
        </CardHeader>

        <CardContent className="py-2 text-left">
          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
            ₹{parseFloat(balance || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-400">Available Balance</p>
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ArrowUpRight
              size={18}
              className="text-green-500 group-hover:text-green-600 transition-colors"
            />
            <span className="hidden sm:inline">Quick actions</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownRight
              size={18}
              className="text-red-500 group-hover:text-red-600 transition-colors"
            />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default AccountCard;
