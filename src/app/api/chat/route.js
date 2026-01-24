import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import {
  getUserFinancialContext,
  createSystemPrompt,
} from "@/lib/chatbot-utils";
import User from "@/models/userModel";
import { connect } from "@/dbConfig/dbConfig";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    await connect();

    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get the user from database
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    const { message, conversationHistory } = await req.json(); // Please explain me this perticular line

    if (!message || message.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty" }),
        { status: 400 },
      );
    }

    // Fetch user's financial context
    const financialData = await getUserFinancialContext(user._id); // Get all the Financial Data
    const systemPrompt = createSystemPrompt(financialData); // Generating the System Prompt

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build chat history for context

    // Learning NOTES->
    /**
     * The chat History is stored in array and each chat is stored in Object form in the SDK with role and Parts ,
     * so the History that we Have Recieved from the Front end must be Transformed into a SDK friendly
     */
    const chatHistory = (conversationHistory || []).map((msg) => ({
      // convert ChatHistory into SDK chat History
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Start chat session with system prompt as context
    const chat = model.startChat({
      // .startChat() opens a new "chat window" between your app and the Gemini model.
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand your financial profile. I'm ready to help you with any questions about your finances, spending patterns, budgets, and financial health.",
            },
          ],
        },
        ...chatHistory,
      ],
      generationConfig: {
        maxOutputTokens: 1024, //Maximum number of tokens (words/pieces of text) the model can generate in one reply
        temperature: 0.7, // It controls Creativity / Randomness , Low = Predictable , High = Creative (rhne de sb chij smjhna jroori nhi hai)
      },
    });

    // Send message with system context
    const result = await chat.sendMessage(message); // sends the msg to the model
    const responseText = result.response.text();

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: responseText,
        role: "assistant",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat",
        details: error.message,
      }),
      { status: 500 },
    );
  }
}

/**
 * NOTES POINTS -> 
 * 1.
 * Here this chat is Empheral -> 
 * EMPHEREL (per request only):
     The chat object returned from startChat() and any in-memory variables. They exist only during the request and are gone afterward.

    FOR Knowledge 
    Persistent : 

User documents, user data, and any DB records you choose to store (e.g., conversationHistory, chat transcripts, summaries).

If you want multi-request continuity, you must store conversation history (or a summarized/sketch of it) in your DB and re-send it with new requests.
 */

/// NOTES->
// Here we are not saving the chat History anyway , just the system and Users Prompt

// Notes
// Why Not Use "system" Role?

// Because in the Google Gemini SDK, the supported roles are only:

// "user"

// "model"

//Summary in One Line

// 1.-> The first user message (systemPrompt) defines who the model is and what it knows.
// 2.-> The next model message (“I understand...”) sets the tone.
// 3.-> The rest of the chat history gives memory.
// 4.-> Finally, your new user message triggers a new, contextual reply.
