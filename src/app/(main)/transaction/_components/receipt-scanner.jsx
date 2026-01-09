"use client";

import { scanReceipt } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import React, { useEffect, useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ReceiptScanner = ({ onScanComplete }) => {
  const fileInputRef = useRef();

  const {
    loading: scanReceiptLoading,
    fn: scanReceiptFn,
    data: scannedData,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    if(file.size > 5*1024*1024){
        toast.error("File size should be less than 5MB");
        return;
    }

    await scanReceiptFn(file);
  };

  useEffect(()=>{
    onScanComplete(scannedData);
    // toast.success("Receipt scanned Successfully");
  },[scanReceiptLoading,scannedData])

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleReceiptScan(file);
          }
        }}
      />
      <Button
        className="w-full h-10 relative overflow-hidden 
    rounded-lg font-semibold text-white tracking-wide 
    bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400
    shadow-md hover:shadow-lg 
    transition-all duration-500 ease-out
    hover:from-violet-600 hover:via-pink-600 hover:to-orange-500
    hover:scale-[1.02] active:scale-[0.98]"
        type="button"
        variant="outline"
        onClick= {() => fileInputRef.current?.click()}
        disabled= {scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            {" "}
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt Using DhanAI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptScanner;
