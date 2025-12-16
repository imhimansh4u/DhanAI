// schema for our Account Form

import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  accountType: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Initial balance is required"),
  isDefault: z.boolean().default(false),
});

// Have to study about it
