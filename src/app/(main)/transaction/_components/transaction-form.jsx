"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema } from "@/app/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { createTransaction } from "@/actions/transaction";
import { Calendar1Icon, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";

const AddTransactionForm = ({ accounts, categories }) => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionType: "EXPENSE",
      amount: "",
      description: "",
      accountId: accounts.find((ac) => ac.isDefault)?._id,
      date: new Date(),
      isRecurring: false,
    },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(createTransaction);

  const transactionType = watch("transactionType");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const recurringInterval = watch("recurringInterval");

  const onSubmit = async (data) => {
    const formData = { ...data, amount: parseFloat(data.amount) };
    transactionFn(formData);
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success("Transaction Created Succesfully");
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading]);

  const filteredCategories = categories.filter(
    (category) => category.type === transactionType
  );

  // handling the scanning
  const handleScanComplete = (scannedData) => {  // Afer the Scanning is Completed , this will be Trigerred 
    if(scannedData){
      setValue("amount",scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if(scannedData.description){
        setValue("description",scannedData.description);
      }
      if(scannedData.category){
        setValue("category",scannedData.category);
      }
    }
    console.log(scannedData); // For debugging 
  };
  return (
    <form
      className="w-full space-y-4 text-black"
      onSubmit={handleSubmit(onSubmit)}
    >
      {/* AI receipt Scanner Here */}
      <div>
        <ReceiptScanner onScanComplete={handleScanComplete} />
      </div>

      {/* Type */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Type</label>
        <Select
          onValueChange={(value) => setValue("transactionType", value)}
          defaultValue={transactionType}
        >
          <SelectTrigger className="w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.transactionType && (
          <p className="text-xs text-red-500">
            {errors.transactionType.message}
          </p>
        )}
      </div>

      {/* Amount + Account */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="text-sm font-semibold">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register("amount")}
            className="w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400"
          />
          {errors.amount && (
            <p className="text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>
        {/* Account section */}
        <div className="flex-1 min-w-[150px] space-y-1">
          <label className="text-sm font-semibold">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className="w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>

            <SelectContent>
              {accounts.map((account) => (
                <SelectItem
                  key={account._id}
                  value={account._id}
                  className="flex justify-between items-center w-full"
                >
                  <span className="text-sm font-medium">{account.name}</span>

                  <span className="flex items-center gap-1 text-gray-500 text-xs ml-auto">
                    <IndianRupee size={12} />
                    {parseFloat(account.balance).toFixed(2)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errors.accountId && (
            <p className="text-xs text-red-500">{errors.accountId.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Category</label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          defaultValue={getValues("category")}
        >
          <SelectTrigger className="w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-xs text-red-500">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center justify-between w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400"
            >
              {date ? format(date, "PPP") : <span>Pick a Date</span>}
              <Calendar1Icon className="h-4 w-4 text-gray-700" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => setValue("date", date)}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-xs text-red-500">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-sm font-semibold">Description</label>
        <Input
          placeholder="Enter Description"
          {...register("description")}
          className="w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400"
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Recurring Switch */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2">
        <div>
          <label className="text-sm font-semibold">Set as Recurring</label>
          <p className="text-xs text-gray-500">
            Schedule this transaction automatically.
          </p>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>

      {isRecurring && (
        <div className="space-y-1">
          <label className="text-sm font-semibold">Recurring Interval</label>
          <Select
            onValueChange={(value) => setValue("recurringInterval", value)}
            defaultValue={recurringInterval}
          >
            <SelectTrigger className="w-full rounded-lg border-gray-300 h-9 text-sm focus:ring-violet-400">
              <SelectValue placeholder="Select Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-xs text-red-500">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="w-full h-9 text-sm bg-white text-black border border-gray-400 hover:bg-red-500 hover:text-white transition-all duration-200"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-full h-9 text-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:opacity-90"
          disabled={transactionLoading}
        >
          Create
        </Button>
      </div>
    </form>
  );
};

export default AddTransactionForm;
