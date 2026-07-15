"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { getBackendUrl, isAuthenticated } from "@/lib/utils";
import {
  Send,
  Loader,
  MessageSquare,
  Sparkles,
  LogIn,
  UserPlus,
  Lock,
  Bot,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { DemoModeModal, isAiServiceError } from "@/components/ui/DemoModeModal";

// Simple toast
function toast(message, type = "info") {
  const toastDiv = document.createElement("div");
  toastDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  toastDiv.textContent = message;
  document.body.appendChild(toastDiv);
  setTimeout(() => toastDiv.remove(), 3000);
}

export default function TryChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const url = getBackendUrl();
      console.log("🌐 Sending to:", `${url}/api/chat/public`);
      console.log("📤 Message:", userMessage);

      // Use public chat endpoint (no auth required for trial)
      const response = await axios.post(
        `${url}/api/chat/public`,
        { message: userMessage },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: false, // Important: don't send credentials for public endpoint
          validateStatus: () => true, // Don't throw on any status, handle manually
        }
      );

      console.log("📥 Response status:", response.status);
      console.log("📥 Response data:", response.data);

      if (response.status === 401) {
        const errorMsg = "Backend returned 401. This endpoint should not require authentication. Please check:\n1. Backend server is running\n2. Route is properly defined\n3. No auth middleware is blocking this route";
        console.error("❌", errorMsg);
        throw new Error(errorMsg);
      }

      if (response.status !== 200) {
        const errorMsg = response.data?.error || `Server returned status ${response.status}`;
        throw new Error(errorMsg);
      }

      if (response.data && response.data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.data.reply }]);
      } else if (response.data && response.data.error) {
        throw new Error(response.data.error);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      if (isAiServiceError(err)) {
        setShowDemoModal(true);
      }
      const errorMessage = err.response?.data?.error || err.message || "Sorry, I encountered an error. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${errorMessage}. Please make sure your backend is running and DEEPSEEK_API_KEY is set.`,
        },
      ]);
      toast("Failed to send message: " + errorMessage, "error");
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamingMessage("");
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast("Copied to clipboard!", "success");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleGetScript = () => {
    if (isAuthenticated()) {
      router.push("/personalize-chatbot");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] flex flex-col">
      {/* Header */}
      <header className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QueryMate</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGetScript}
              variant="outline"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-900/30"
            >
              <Lock className="w-4 h-4 mr-2" />
              Get Embed Script
            </Button>
            {!isAuthenticated() ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button variant="primary">Go to Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 mb-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-[rgb(var(--color-primary))]/10 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-[rgb(var(--color-primary))]" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-[rgb(var(--color-text-primary))]">
                Try QueryMate AI Chat
              </h3>
              <p className="text-lg text-[rgb(var(--color-text-secondary))] mb-6 max-w-md">
                This is a free trial. Ask me anything! 
                <span className="text-[rgb(var(--color-primary))] font-medium block mt-2">
                  Sign up to create your own personalized chatbot and get the embed script.
                </span>
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md mb-6">
                {[
                  "What can you help me with?",
                  "Explain how QueryMate works",
                  "Tell me about AI chatbots",
                  "Help me with my business",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="p-4 text-left rounded-xl border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-elevated))] hover:border-[rgb(var(--color-primary))] transition-all text-sm text-[rgb(var(--color-text-primary))]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <p className="text-sm text-purple-300">
                  <strong className="text-white">Note:</strong> This is a public trial. 
                  For personalized chatbots and embed scripts, please{" "}
                  <Link href="/signup" className="underline font-medium hover:text-purple-200">
                    sign up
                  </Link>.
                </p>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-5 ${
                  message.role === "user"
                    ? "bg-[rgb(var(--color-primary))] text-white rounded-br-md"
                    : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-primary))] border border-[rgb(var(--color-border))] rounded-bl-md"
                } shadow-lg`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                {message.role === "assistant" && (
                  <div className="mt-3 flex items-center space-x-2 pt-3 border-t border-[rgb(var(--color-border))]">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center space-x-1 px-2 py-1 rounded hover:bg-[rgb(var(--color-surface))]"
                    >
                      <Send className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && !streaming && (
            <div className="flex justify-start">
              <div className="bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border))] rounded-2xl rounded-bl-md p-4 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin text-[rgb(var(--color-primary))]" />
                  <span className="text-sm text-[rgb(var(--color-text-secondary))]">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] rounded-xl">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything... (This is a free trial)"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] resize-none max-h-32 overflow-y-auto transition-all"
                rows={1}
                disabled={loading || streaming}
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || loading || streaming}
              variant="primary"
              size="lg"
              className="h-12 px-6"
            >
              {loading || streaming ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-center text-[rgb(var(--color-text-secondary))] mt-2">
            Free trial • Sign up to create your own chatbot and get embed scripts
          </p>
        </div>
      </div>

      {/* Auth Required Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In Required"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-center text-[rgb(var(--color-text-secondary))]">
            To get your personalized chatbot embed script, please sign up or log in.
          </p>
          <div className="flex space-x-3 pt-4">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button variant="primary" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </Link>
          </div>
          <p className="text-xs text-center text-[rgb(var(--color-text-secondary))] pt-4 border-t border-[rgb(var(--color-border))]">
            Signing up is free and takes less than a minute!
          </p>
        </div>
      </Modal>

      {/* Demo Mode Modal */}
      <DemoModeModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
}

