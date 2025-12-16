"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/app/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { createAccount } from "@/actions/dashboard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CreateAccountDrawer = ({ children }) => {
  const [open, setOpen] = useState(false);

  const {
    register, // it connects the input to react hook form
    handleSubmit,
    formState: { errors },
    setValue, // used to set some field values like select
    watch, //Gives live form values.
    reset, //Resets the form to defaultValues.
  } = useForm({
    resolver: zodResolver(accountSchema), // use Zod to validate the form
    defaultValues: {
      // Here are the Default Values
      name: "",
      accountType: "CURRENT",
      balance: "",
      isDefault: false,
    },
  });

  const {
    data: newAccount,
    loading: createAccountLoading,
    error,
    fn: createAccountFn,
  } = useFetch(createAccount);

  useEffect(() => {
    if (newAccount && !createAccountLoading) {
      toast.success("Account created succesfully");
      reset();
      setOpen(false);
    }
  }, [createAccountLoading, newAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create Account");
    }
  }, [error]);

  const onSubmit = async (data) => {
    await createAccountFn(data);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="p-6 bg-white rounded-t-2xl shadow-lg">
        <DrawerHeader className="text-center mb-4">
          <DrawerTitle className="text-xl font-semibold text-gray-800">
            Create New Account
          </DrawerTitle>
          <p className="text-sm text-gray-500">
            Fill in details to add a new account
          </p>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Account Name */}
          <div className="flex flex-col space-y-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Account Name
            </label>
            <Input
              id="name"
              placeholder="e.g. My Savings"
              {...register("name")}
              className="border-gray-300 focus:ring-green-500 focus:border-green-500"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Account Type */}
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="accountType"
              className="text-sm font-medium text-gray-700"
            >
              Account Type
            </label>
            <Select
              onValueChange={(value) => setValue("accountType", value)}
              defaultValue={watch("accountType")}
            >
              <SelectTrigger id="accountType" className="border-gray-300">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CURRENT">Current</SelectItem>
                <SelectItem value="SAVINGS">Savings</SelectItem>
              </SelectContent>
            </Select>
            {errors.accountType && (
              <p className="text-xs text-red-500">
                {errors.accountType.message}
              </p>
            )}
          </div>

          {/* Now for the Balance Part */}
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="balance"
              className="text-sm font-medium text-gray-700"
            >
              Initial Balance
            </label>
            <Input
              id="balance"
              type="number"
              placeholder="Enter initial balance"
              {...register("balance")}
              className="border-gray-300 focus:ring-green-500 focus:border-green-500"
            />
            {errors.balance && (
              <p className="text-xs text-red-500">{errors.balance.message}</p>
            )}
          </div>

          {/* Default Switch */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
            <div>
              <label
                htmlFor="isDefault"
                className="text-sm font-medium text-gray-700"
              >
                Set as Default
              </label>
              <p className="text-xs text-gray-500">
                This account will be used for transactions by default.
              </p>
            </div>
            <Switch
              id="isDefault"
              onCheckedChange={(value) => setValue("isDefault", value)}
              checked={watch("isDefault")}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <DrawerClose asChild>
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
            </DrawerClose>
            <Button
              type="submit"
              className="bg-green-600 text-white hover:bg-green-700"
              disabled={createAccountLoading}
            >
              {createAccountLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
};

export default CreateAccountDrawer;
