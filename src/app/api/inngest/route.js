import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { checkBudgetAlerts } from "@/lib/inngest/functions";

// Create an API that serves functions. Avoid export-destructuring to
// prevent parser issues in some dev environments.
const handlers = serve({
  client: inngest,
  functions: [checkBudgetAlerts],
});

export const GET = handlers.GET;
export const POST = handlers.POST;
export const PUT = handlers.PUT;
