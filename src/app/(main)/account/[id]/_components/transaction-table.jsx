"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { categoryColors } from "@/data/Categories";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/accounts";
import { BarLoader } from "react-spinners";
import { toast } from "sonner";

function TransactionTable({ transactions }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    field: "date",
    direction: "desc",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [recurringFilter, setRecurringFilter] = useState("");

  // For pagination Purpose
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);

  React.useEffect(() => {
    console.log(
      "TransactionTable - transactions sample:",
      transactions?.slice?.(0, 5)
    );
  }, [transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    //  useMemo memoize and values and changes when any of the dependencies changes
    let result = [...transactions];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transactions) =>
        transactions.description?.toLowerCase().includes(searchLower)
      );
    }

    if (recurringFilter) {
      result = result.filter((transactions) => {
        if (recurringFilter === "recurring") {
          return transactions.isRecurring;
        }
        return !transactions.isRecurring;
      });
    }

    if (typeFilter) {
      result = result.filter(
        (transactions) => transactions.transactionType == typeFilter
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case "date":
          // Strictly compare the transaction `date` field. Missing dates are
          // treated as 'after' so they appear later when sorting descending.
          {
            const ta = isNaN(new Date(a.date).getTime())
              ? null
              : new Date(a.date).getTime();
            const tb = isNaN(new Date(b.date).getTime())
              ? null
              : new Date(b.date).getTime();

            if (ta === null && tb === null) comparison = 0;
            else if (ta === null) comparison = 1;
            else if (tb === null) comparison = -1;
            else comparison = ta - tb;
          }
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, recurringFilter, sortConfig]);

  // To handle the Sorting
  const handleSort = (field) => {
    setSortConfig((current) => ({
      field,
      direction:
        current.field === field && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelect = (_id) => {
    setSelectedIds((current) =>
      current.includes(_id)
        ? current.filter((item) => item != _id)
        : [...current, _id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(
      (current) =>
        current.length === filteredAndSortedTransactions.length // If user already selected all , then remove all selected
          ? []
          : filteredAndSortedTransactions.map((t) => t._id) // else add all the selected one and store there _id only
    );
  };
  // To delete any number of Transactions
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are You sure , You want to delete ${selectedIds.length} transactions ?`
      )
    ) {
      return;
    }

    deleteFn(selectedIds);
  };

  useEffect(() => {
    if (deleted && !deleteLoading) {
      toast.success("Transactions deleted Successfully");
    }
    setSelectedIds([]); // all the selected ones are now gone

    //Stay on same page, unless it becomes empty after delete
    const newTotalPages = Math.ceil(
      (filteredAndSortedTransactions.length - selectedIds.length) / itemsPerPage
    );

    // if current page becomes empty and there are previous pages, go back one page
    if (currentPage > newTotalPages && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [deleted, deleteLoading]);
  // To clear the applied Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("");
    setRecurringFilter("");
    setSelectedIds([]);
  };
  // if any searching sorting things Happen or HandleBulkDelete happen , then set the curret page to 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, recurringFilter, sortConfig]);

  // Now all the Important Variables
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / itemsPerPage
  );
  const startIndx = (currentPage - 1) * itemsPerPage;
  const endIndx = startIndx + itemsPerPage;
  const currentItems = filteredAndSortedTransactions.slice(startIndx, endIndx);

  //  Go to next page
  const handleNextClick = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to top
    }
  };

  //  Go to previous page
  const handlePrevClick = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to top
    }
  };

  return (
    <div className="w-full mt-10 px-4 sm:px-10">
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search Transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 border border-gray-300 w-full"
          />
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full sm:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="border border-gray-300 w-full sm:w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={recurringFilter}
            onValueChange={(value) => setRecurringFilter(value)}
          >
            <SelectTrigger className="border border-gray-300 w-full sm:w-44">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recurring">Recurring</SelectItem>
              <SelectItem value="non-recurring">Non-Recurring</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="border border-gray-300 w-full sm:w-auto"
            >
              <Trash className="mr-1 h-4 w-4" />
              Delete {selectedIds.length} Items
            </Button>
          )}

          {(searchTerm || typeFilter || recurringFilter) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Clear Filters"
              className="border border-gray-300 w-full sm:w-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      {/* All the Headers Here */}
      <div className="overflow-x-auto border border-gray-300 rounded-md">
        <Table className="min-w-full text-sm text-gray-800 border-collapse">
          {/* Header */}
          <TableHeader>
            <TableRow className="border-b border-gray-300 bg-gray-50">
              <TableHead className="py-4 pl-8 border-r border-gray-200">
                <Checkbox
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedIds.length ===
                      filteredAndSortedTransactions.length &&
                    filteredAndSortedTransactions.length > 0
                  }
                />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-emerald-600 transition-colors border-r border-gray-200 px-4 py-3"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center font-semibold whitespace-nowrap">
                  Date{" "}
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="border-r border-gray-200 px-4 py-3 font-semibold whitespace-nowrap">
                Description
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-emerald-600 transition-colors border-r border-gray-200 px-4 py-3 font-semibold whitespace-nowrap"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category{" "}
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:text-emerald-600 transition-colors border-r border-gray-200 px-4 py-3 font-semibold whitespace-nowrap"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center">
                  Amount
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead className="px-4 py-3 font-semibold whitespace-nowrap">
                Recurring
              </TableHead>
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody>
            {filteredAndSortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-gray-500 italic"
                >
                  No Transactions Found
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((txn) => (
                <TableRow
                  key={txn._id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <TableCell className="pl-8 border-r border-gray-200">
                    <Checkbox
                      onCheckedChange={() => handleSelect(txn._id)}
                      checked={selectedIds.includes(txn._id)}
                    />
                  </TableCell>

                  <TableCell className="border-r border-gray-200 px-4 whitespace-nowrap">
                    {txn.date && !isNaN(new Date(txn.date))
                      ? format(new Date(txn.date), "PP")
                      : "—"}
                  </TableCell>

                  <TableCell className="border-r border-gray-200 px-4 text-gray-700 break-words">
                    {txn.description}
                  </TableCell>

                  {/* Category */}
                  <TableCell className="border-r border-gray-200 px-4 capitalize whitespace-nowrap">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: categoryColors[txn.category] || "#A7F3D0",
                        color: "#064E3B",
                      }}
                    >
                      {txn.category}
                    </span>
                  </TableCell>

                  {/* Amount */}
                  <TableCell
                    className={`border-r border-gray-200 px-4 font-semibold whitespace-nowrap ${
                      txn.transactionType === "EXPENSE"
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {txn.transactionType === "EXPENSE" ? "-" : "+"}₹
                    {Number(txn.amount || 0).toFixed(2)}
                  </TableCell>

                  {/* Recurring */}
                  <TableCell className="px-4 whitespace-nowrap">
                    {txn.isRecurring ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge
                            variant="outline"
                            className="gap-1 bg:purple-100 text-purple-800 hover:bg-purple-300 border-2 border-black"
                          >
                            <RefreshCcw className="h-3 w-3" />
                            {txn?.recurringInterval ?? "Unknown"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <div>
                              Next Date:
                              <div>
                                {format(new Date(txn.nextRecurringDate), "PP")}
                              </div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 hover:bg-black hover:text-white border-2 border-black"
                      >
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="px-4 whitespace-nowrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(`/transaction/create?edit=${txn._id}`);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteFn([txn._id])}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {/* This One is for the Next Button and Prev Button */}
        {/* 🟩 Pagination Controls */}
        <div>
          {filteredAndSortedTransactions.length > itemsPerPage && (
            <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevClick}
                disabled={currentPage === 1}
                className="px-3"
              >
                Prev
              </Button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                onClick={handleNextClick}
                disabled={currentPage === totalPages}
                className="px-3"
              >
                Next
              </Button>
            </div>
          )}
          {/*  Page number buttons */}
          <div className="flex justify-center gap-1 mt-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-3 text-sm"
              >
                {i + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransactionTable;
