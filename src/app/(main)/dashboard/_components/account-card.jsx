"use client"

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
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
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

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount, updateDefaultLoading]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Default account updated successfully");
    }
  }, [error]);

  return (
    <Link href={`/account/${_id}`} className="block">
      <Card className="group cursor-pointer hover:shadow-md transition-all border border-gray-200 bg-white rounded-xl p-2 sm:p-3">
        <CardHeader className="flex items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-gray-800">
              {name}
            </CardTitle>
            <p className="text-xs text-gray-500">
              {accountType
                ? `${accountType.charAt(0)}${accountType
                    .slice(1)
                    .toLowerCase()}`
                : "Account"}
            </p>
          </div>
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
          />
        </CardHeader>

        <CardContent className="py-3 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            ₹{parseFloat(balance || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-400">Available Balance</p>
        </CardContent>

        <CardFooter className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100">
          <ArrowUpRight
            size={20}
            className="text-green-500 group-hover:text-green-600 transition-colors"
          />
          <ArrowDownRight
            size={20}
            className="text-red-500 group-hover:text-red-600 transition-colors"
          />
        </CardFooter>
      </Card>
    </Link>
  );
};

export default AccountCard;
