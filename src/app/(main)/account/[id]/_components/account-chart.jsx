"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, isSameDay, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");
  const [selectedDate, setSelectedDate] = useState(null);

  const filteredData = useMemo(() => {
    const now = new Date();

    // If a specific date is chosen then only so show only that date’s records
    if (selectedDate) {
      const sameDayTxns = transactions.filter((t) =>
        isSameDay(new Date(t.createdAt), selectedDate)
      );

      const income = sameDayTxns
        .filter((t) => t.transactionType === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = sameDayTxns
        .filter((t) => t.transactionType === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return [
        {
          date: format(selectedDate, "MMM dd"),
          income,
          expense,
        },
      ];
    }

    //  Otherwise, use date range filtering
    const range = DATE_RANGES[dateRange];
    const startDate = range.days
      ? startOfDay(new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000))
      : new Date(0);

    const filtered = transactions.filter((t) => {
      const txnDate = new Date(t.createdAt);
      return txnDate >= startDate && txnDate <= endOfDay(now);
    });

    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.createdAt), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.transactionType === "INCOME") {
        acc[date].income += Number(transaction.amount);
      } else if (transaction.transactionType === "EXPENSE") {
        acc[date].expense += Number(transaction.amount);
      }
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [transactions, dateRange, selectedDate]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6">
        <CardTitle className="text-base font-semibold">
          Transaction Overview
        </CardTitle>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/*  Date Picker */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              className="border rounded-md px-2 py-1 text-sm outline-none dark:bg-background dark:text-foreground"
              onChange={(e) =>
                setSelectedDate(
                  e.target.value ? new Date(e.target.value) : null,
                )
              }
            />
          </div>

          {/* Range Selector */}
          <Select
            value={dateRange}
            onValueChange={(v) => {
              setDateRange(v);
              setSelectedDate(null); // reset date when range changes
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap justify-around mb-6 text-sm gap-4">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              ₹{totals.income.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              ₹{totals.expense.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                totals.income - totals.expense >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ₹{(totals.income - totals.expense).toFixed(2)}
            </p>
          </div>
        </div>

        {/*  Responsive Chart */}
        <div className="h-[280px] sm:h-[320px] md:h-[360px] w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                formatter={(value) => [`₹${value}`, undefined]}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
