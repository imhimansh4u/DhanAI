"use server";

import mongoose from "mongoose";
import { auth } from "@clerk/nextjs/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Account from "@/models/accounts";
import Transaction from "@/models/transactions";
import { revalidatePath } from "next/cache";
import { request } from "@arcjet/next";
import aj from "@/lib/arcjet";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Below is necessary bcs hm directly mongodb Objects ko frontend ko nhi bhj skte hai , we need to convert it to plain json objects
const serializeAmount = (obj) => {
  if (!obj) return obj;

  const serialized = { ...obj };

  // Convert Decimal128 to number
  if (serialized.amount && serialized.amount.toString) {
    serialized.amount = parseFloat(serialized.amount.toString());
  }

  // Convert ObjectIds to strings
  if (serialized._id && serialized._id.toString) {
    serialized._id = serialized._id.toString();
  }
  if (serialized.userId && serialized.userId.toString) {
    serialized.userId = serialized.userId.toString();
  }
  if (serialized.accountId && serialized.accountId.toString) {
    serialized.accountId = serialized.accountId.toString();
  }

  // Convert Date objects to ISO strings (optional but safe)
  const dateFields = [
    "date",
    "nextRecurringDate",
    "lastProcessed",
    "createdAt",
    "updatedAt",
  ];
  for (const field of dateFields) {
    if (serialized[field] instanceof Date) {
      serialized[field] = serialized[field].toISOString();
    }
  }

  return serialized;
};

// Function to Create a Transaction
export async function createTransaction(data) {
  try {
    await connect();
  } catch (error) {
    throw new Error("Database Connection Failed");
  }

  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkUserId: userId });
    if (!user) throw new Error("User Not Found");

    // get the request data for Arcjet
    const req = await request(); // it will give the incoming request Header

    // check rate limit
    const decesion = await aj.protect(req, {
      userId,
      requested: 1, // Specify How many Tokens to consume
    });

    if (decesion.isDenied()) {
      if (decesion.reason.isRateLimit()) {
        //remaining will tell how many requests they have left before blocking
        const { remaining, reset } = decesion.reason; // reset will tell us that after How much time , the Tokens will reset
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests,  Please try again later. ");
      }

      throw new Error("Request Blocked");
    }

    const account = await Account.findOne({
      _id: data.accountId,
      userId: user._id,
    });
    if (!account) throw new Error("Account not Found");

    const balanceChange =
      data.transactionType === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = parseFloat(account.balance.toString()) + balanceChange;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newTransaction = await Transaction.create(
        [
          {
            ...data,
            userId: user._id,
            nextRecurringDate:
              data.isRecurring && data.recurringInterval
                ? calculateNextRecurringDate(
                    data.lastProcessed || new Date(),
                    data.recurringInterval
                  )
                : null,
          },
        ],
        { session }
      );

      await Account.updateOne(
        { _id: data.accountId },
        {
          $set: {
            balance: mongoose.Types.Decimal128.fromString(
              newBalance.toString()
            ),
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      await Promise.all([
        revalidatePath("/dashboard"),
        revalidatePath(`/account/${data.accountId}`),
      ]);

      // Serialize doc
      const serializedTx = serializeAmount(newTransaction[0].toObject());
      return { success: true, data: serializedTx };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Adding Transaction Failed:", error);
      throw new Error(`Failed to Create Transaction: ${error.message}`);
    }
  } catch (error) {
    throw new Error(error.message);
  }
}

// Helper Function
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);
  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
}

// Backend Part of AI Reciept Scanner
export async function scanReceipt(file) {
  try {
    const model = genAi.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();    // To convert the file into raw Binary Data..

    // convert ArrayBuffer to Base64 (Bcs it is a standard way of Doing the Things)
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = ` Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }
      
      description should be must of only 5-7 words
      If its not a recipt, return an empty object`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;

    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();   // Bcs the Response will contain some zibris things in the front and end

    try {
      const data = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.log("Error Parsing JSON response: ", parseError);
      throw new Error("Invalid respnse format from Gemini");
    }
  } catch (error) {
    console.log("Error Scanning Receipt :", error.message);
    throw new Error("Failed to Scan the Receipt");
  }
}
