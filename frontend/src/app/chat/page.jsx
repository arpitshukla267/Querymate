"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBackendUrl, getAuthToken, isAuthenticated, formatTime } from "@/lib/utils";
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Loader,
  Menu,
  X,
} from "lucide-react";

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

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchConversations();
    createNewConversation();
  }, [router]);

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

  const fetchConversations = async () => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const response = await axios.get(`${url}/api/conversations?type=general`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.conversations) {
        setConversations(response.data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  const createNewConversation = async () => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const response = await axios.post(
        `${url}/api/conversations`,
        { title: "New Chat", type: "general" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.conversation) {
        setCurrentConversationId(response.data.conversation._id);
        setMessages([]);
        fetchConversations();
      }
    } catch (err) {
      console.error("Error creating conversation:", err);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const response = await axios.get(`${url}/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.conversation) {
        setCurrentConversationId(conversationId);
        const conversationMessages = response.data.conversation.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
        setMessages(conversationMessages);
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
      toast("Failed to load conversation", "error");
    }
  };

  const sendMessage = async (useStreaming = true) => {
    if (!input.trim() || loading || streaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      // If no conversation, create one
      let conversationId = currentConversationId;
      if (!conversationId) {
        const newConvRes = await axios.post(
          `${url}/api/conversations`,
          {
            title: userMessage.substring(0, 50),
            type: "general",
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        conversationId = newConvRes.data.conversation._id;
        setCurrentConversationId(conversationId);
        fetchConversations();
      }

      if (useStreaming) {
        // Use streaming
        setStreaming(true);
        setStreamingMessage("");
        
        const response = await fetch(`${url}/api/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: userMessage, conversationId }),
        });

        if (!response.ok) {
          throw new Error("Streaming failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                // Save complete message
                if (streamingMessage) {
                  setMessages((prev) => [...prev, { role: "assistant", content: streamingMessage }]);
                }
                setStreaming(false);
                setStreamingMessage("");
                setLoading(false);
                fetchConversations();
                return;
              }

              try {
                const json = JSON.parse(data);
                if (json.content) {
                  setStreamingMessage((prev) => prev + json.content);
                } else if (json.error) {
                  throw new Error(json.error);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } else {
        // Use regular API
        const response = await axios.post(
          `${url}/api/chat`,
          { message: userMessage, conversationId },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: response.data.reply }]);
          fetchConversations();
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      toast("Failed to send message", "error");
    } finally {
      setLoading(false);
      setStreaming(false);
      setStreamingMessage("");
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      await axios.delete(`${url}/api/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (currentConversationId === conversationId) {
        createNewConversation();
      }
      fetchConversations();
      toast("Conversation deleted", "success");
    } catch (err) {
      console.error("Error deleting conversation:", err);
      toast("Failed to delete conversation", "error");
    }
  };

  const updateConversationTitle = async (conversationId, newTitle) => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      await axios.patch(
        `${url}/api/conversations/${conversationId}`,
        { title: newTitle },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchConversations();
      setEditingTitle(null);
      toast("Title updated", "success");
    } catch (err) {
      console.error("Error updating title:", err);
      toast("Failed to update title", "error");
    }
  };

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast("Copied to clipboard!", "success");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(true); // Use streaming by default
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] animate-fade-in">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-64 bg-[rgb(var(--color-surface-elevated))] border-r border-[rgb(var(--color-border))] z-40 transition-transform duration-300 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[rgb(var(--color-border))]">
          <Button
            onClick={createNewConversation}
            variant="primary"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv._id}
              className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === conv._id
                  ? "bg-[rgb(var(--color-primary))] text-white"
                  : "hover:bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))]"
              }`}
              onClick={() => loadConversation(conv._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingTitle === conv._id ? (
                    <input
                      type="text"
                      defaultValue={conv.title}
                      className="w-full bg-transparent border-b border-current outline-none text-sm"
                      onBlur={(e) => {
                        if (e.target.value.trim()) {
                          updateConversationTitle(conv._id, e.target.value.trim());
                        } else {
                          setEditingTitle(null);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          if (e.target.value.trim()) {
                            updateConversationTitle(conv._id, e.target.value.trim());
                          } else {
                            setEditingTitle(null);
                          }
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                  )}
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(conv.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitle(conv._id);
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv._id);
                    }}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <MessageSquare className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <h2 className="text-lg font-semibold text-[rgb(var(--color-text-primary))]">
              AI Support Chat
            </h2>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[rgb(var(--color-background))] to-[rgb(var(--color-surface))]">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-[rgb(var(--color-primary))]/10 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-[rgb(var(--color-primary))]" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-[rgb(var(--color-text-primary))]">
                Start a Conversation
              </h3>
              <p className="text-lg text-[rgb(var(--color-text-secondary))] mb-8 max-w-md">
                Ask me anything! I'm here to help with questions, explanations, and more.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {[
                  "What can you help me with?",
                  "Explain how to use QueryMate",
                  "Tell me about AI chatbots",
                  "Help me with my business",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="p-4 text-left rounded-xl border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface-elevated))] hover:border-[rgb(var(--color-primary))] transition-all text-sm text-[rgb(var(--color-text-primary))] hover:shadow-lg"
                  >
                    {prompt}
                  </button>
                ))}
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
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Streaming message */}
          {streaming && (
            <div className="flex justify-start">
              <div className="max-w-3xl rounded-2xl p-5 bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-primary))] border border-[rgb(var(--color-border))] rounded-bl-md shadow-lg">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 bg-[rgb(var(--color-primary))] ml-1 animate-pulse"></span>
                  </p>
                </div>
              </div>
            </div>
          )}

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
        <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))]">
          <div className="flex items-end space-x-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))] resize-none max-h-32 overflow-y-auto transition-all"
                rows={1}
                disabled={loading || streaming}
              />
              <div className="absolute right-3 bottom-3 text-xs text-[rgb(var(--color-text-secondary))]">
                {input.length > 0 && `${input.length} chars`}
              </div>
            </div>
            <Button
              onClick={() => sendMessage(true)}
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
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
