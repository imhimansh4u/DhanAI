import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "DhanAI",
  signingKey: process.env.INNGEST_SIGNING_KEY,
  name: "DhanAI",
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential Backoff
    maxAttempts: 2,
  }),
});

// This set Ups the Client for the Inngest to work