"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button"; 

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white text-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-8xl font-bold text-green-600 mb-4"
      >
        404
      </motion.h1>

      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-6"
      >
        Oops! Page not found
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-500 max-w-md mb-10"
      >
        The page you’re looking for doesn’t exist or has been moved. Let’s get
        you back on track!
      </motion.p>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Link href="/">
          <Button className="px-6 py-3 rounded-full bg-green-600 hover:bg-green-700 text-white text-lg shadow-md transition-all duration-300">
            Go Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
