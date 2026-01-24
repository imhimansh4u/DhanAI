"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send message");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      toast.error(error.message || "Failed to get response from chatbot");
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 md:bottom-6 md:right-6 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-40"
          aria-label="Open chatbot"
        >
          <MessageCircle size={24} className="animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[95vw] sm:w-[380px] md:w-[400px] h-[80vh] sm:h-[550px] bg-white dark:bg-slate-900 flex flex-col rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-3 sm:p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="opacity-90" />
              <span className="font-semibold text-sm sm:text-base">
                DhanAI ChatBot
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-md transition"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Section */}
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 text-center space-y-2">
                <MessageCircle size={48} className="opacity-30" />
                <p className="font-semibold">Hello 👋</p>
                <p className="text-sm opacity-80">
                  Ask me anything about your finances, spending, or savings!
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words shadow ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-none"
                          : "bg-white dark:bg-slate-800 text-gray-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-2 rounded-2xl rounded-bl-none flex items-center">
                      <Loader2
                        size={18}
                        className="animate-spin text-purple-600 dark:text-purple-400"
                      />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 p-3"
          >
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask about your finances..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 text-sm px-3 py-2 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg transition-all shadow-sm"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
