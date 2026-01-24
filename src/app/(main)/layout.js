import React from "react";
import Chatbot from "@/components/chatbot";

const Mainlayout = ({ children }) => {
  return (
    <>
      {/* Main Page Wrapper */}
      <div className="min-h-screen w-full flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 text-gray-900 dark:text-gray-100">
        {/* Page Content Container */}
        <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 transition-all">
          {children}
        </main>
      </div>

      {/* Fixed Chatbot Wrapper */}
      <div className="fixed inset-0 flex items-end justify-end sm:items-end sm:justify-end p-4 sm:p-6 pointer-events-none z-50">
        <div className="pointer-events-auto">
          <Chatbot />
        </div>
      </div>
    </>
  );
};

export default Mainlayout;
