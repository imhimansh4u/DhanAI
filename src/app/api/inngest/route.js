import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  checkBudgetAlerts,
  generateMonthlyReports,
} from "@/lib/inngest/functions";
import {
  processRecurringTransaction,
  triggerRecurringTransactions,
} from "@/lib/inngest/functions";

// Create an API that serves functions. Avoid export-destructuring to
// prevent parser issues in some dev environments.
const handlers = serve({
  client: inngest,
  functions: [
    checkBudgetAlerts,
    processRecurringTransaction,
    triggerRecurringTransactions,
    generateMonthlyReports,
  ],
});

// Log when the route is accessed
export const GET = async (request) => {
  console.log("[Inngest] GET request to /api/inngest");
  console.log("[Inngest] Keys configured:", {
    hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
    hasApiKey: !!process.env.INNGEST_API_KEY,
    hasBaseUrl: !!process.env.INNGEST_BASE_URL,
  });
  return handlers.GET(request);
};

export const POST = async (request) => {
  console.log("[Inngest] POST request to /api/inngest");
  return handlers.POST(request);
};

export const PUT = async (request) => {
  console.log("[Inngest] PUT request to /api/inngest");
  return handlers.PUT(request);
};
