import arcjet from "@arcjet/next";
import { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"], // it means arcJet will Track limits Per User
  rules: [
    tokenBucket({
      // The Token Bucket is like a bucket of some tokens , when it is empty it refills after a perticular Period of time here 1 hour
      mode: "LIVE",
      refillRate: 10, // Add 10 tokens every hour
      interval: 3600, //  1 hour ke baad refill ho jaega
      capacity: 10, // Maximum of 10 tokens at once can be consumed
    }),
  ],
});


export default aj;