import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "dhan-ai",
  name: "DhanAI",
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.INNGEST_BASE_URL,
  eventKey: process.env.INNGEST_EVENT_KEY,
  retryFunction: async (attempt) => ({
    delay: Math.pow(2, attempt) * 1000, // Exponential Backoff
    maxAttempts: 2,
  }),
});

// This sets up the Client for Inngest to work
// Required environment variables for Vercel:
// - INNGEST_SIGNING_KEY: Your Inngest signing key
// - INNGEST_API_KEY: Your Inngest API key (for Cloud)
// - INNGEST_BASE_URL: Inngest Cloud endpoint (e.g., https://api.inngest.com)
// - INNGEST_EVENT_KEY: Your event API key