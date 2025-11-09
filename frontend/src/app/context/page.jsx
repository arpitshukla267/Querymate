"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { Save, FileText, Send, MessageCircle, RefreshCw, RotateCcw, Palette } from "lucide-react";

// Extract formatContext outside component to avoid recreation
const formatContext = (data) => {
  if (!data || typeof data !== 'object') return "";
  let formatted = "";
  if (data.business_name) formatted += `Business Name: ${data.business_name}\n\n`;
  if (data.description) formatted += `Description:\n${data.description}\n\n`;
  if (data.target_audience) formatted += `Target Audience: ${data.target_audience}\n\n`;
  if (data.features) formatted += `Features:\n${data.features}\n\n`;
  if (data.pricing) formatted += `Pricing: ${data.pricing}\n\n`;
  if (data.support) formatted += `Support: ${data.support}\n\n`;
  if (data.contact) formatted += `Contact: ${data.contact}\n\n`;
  Object.keys(data).forEach(key => {
    if (!["business_name", "description", "target_audience", "features", "pricing", "support", "contact"].includes(key) && data[key]) {
      formatted += `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}: ${data[key]}\n\n`;
    }
  });
  return formatted.trim() || JSON.stringify(data, null, 2);
};

// Helper function for retry logic with exponential backoff
const retryRequest = async (requestFn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

function ContextPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionStage, setSessionStage] = useState("collecting");
  const [finalContext, setFinalContext] = useState("");
  const [showFinalContext, setShowFinalContext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [resetting, setResetting] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState({
    widgetColor: "#667eea",
    logoColor: "#ffffff",
    chatWindowColor: "#ffffff",
    headerColor: "#667eea",
    headerText: "QueryMate",
    poweredByText: "Powered by QueryMate"
  });
  const [savingWidget, setSavingWidget] = useState(false);
  const messagesEndRef = useRef(null);

  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "https://querymate-backend-sz0d.onrender.com";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load widget settings
  const loadWidgetSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const { data } = await axios.get(`${url}/api/user/widget-settings`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000
        });

        if (data && data.widgetSettings) {
          setWidgetSettings(data.widgetSettings);
        }
      } catch (err) {
        // If 404, the endpoint might not exist yet - use defaults silently
        if (err.response?.status === 404) {
          console.log("Widget settings endpoint not found, using defaults");
          // Keep default settings
        } else {
          throw err; // Re-throw other errors
        }
      }
    } catch (err) {
      console.error("Load widget settings error:", err);
      // Use defaults on any error
    }
  }, [url]);

  // Optimized loadSession with parallel API calls where possible
  const loadSession = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to manage your context data.");
        setLoading(false);
        return;
      }

      const { data } = await retryRequest(async () => {
        return await axios.get(`${url}/api/context-session`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000
        });
      });

      setSessionStage(data.session.stage);

      // If user already has context data, show it in read-only mode
      if (data.session.hasExistingContext) {
        // Make this call in parallel if possible, but we need session data first
        try {
          const contextData = await retryRequest(async () => {
            return await axios.get(`${url}/api/user/context`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 25000
            });
          });
          setFinalContext(contextData.data.contextData || "");
          setShowFinalContext(true);
          setMessages([
            {
              type: "ai",
              content: "You already have context data set up. You can view and edit it below, or start a new conversation to update it."
            }
          ]);
        } catch (contextErr) {
          console.error("Load context data error:", contextErr);
          // Don't block the UI if this fails
          setShowFinalContext(true);
        }
      } else if (data.session.stage === "complete") {
        // Session is complete, show final context
        const contextSummary = formatContext(data.session.collectedData);
        setFinalContext(contextSummary);
        setShowFinalContext(true);
        setMessages([
          {
            type: "ai",
            content: "✅ Context setup complete! Here's the information I gathered about your business."
          }
        ]);
      } else {
        // Show initial message if available
        if (data.initialMessage) {
          setMessages([
            {
              type: "ai",
              content: data.initialMessage
            }
          ]);
        }
      }
    } catch (err) {
      console.error("Load session error:", err);
      let errorMsg = "Failed to load session. ";
      
      if (err.response?.status === 401) {
        errorMsg += "Please login again.";
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errorMsg = "Request timed out after multiple retries. The server may be slow. Click 'Update' to retry.";
      } else if (err.request) {
        errorMsg = "Unable to connect to server. Please check if the backend is running.";
      } else {
        errorMsg += err.message || "Please try again.";
      }
      
      setMessage(`⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Update function to refresh data and check if anything is left
  const handleUpdate = async () => {
    setMessage("");
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to update context data.");
        setLoading(false);
        return;
      }

      // Load session first to get current state
      const { data } = await retryRequest(async () => {
        return await axios.get(`${url}/api/context-session`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 25000
        });
      });

      // If session is complete, ask if there's anything left and reset to allow new questions
      if (data.session.stage === "complete") {
        // Reset session to allow new questions
        try {
          await axios.delete(`${url}/api/context-session`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 20000
          });
        } catch (err) {
          console.error("Error resetting for update:", err);
        }
        
        // Reload to get fresh session
        await loadSession();
        
        // Ask if there's anything left
        setMessages(prev => [...prev, {
          type: "ai",
          content: "Is there anything else you'd like to add or update about your business? If so, please let me know and I'll help you update the context."
        }]);
      } else {
        // Just reload the session
        await loadSession();
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage("❌ Failed to update. Please try again.");
      setLoading(false);
    }
  };

  // Reset function to start fresh
  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset? This will clear your current context session and start fresh.")) {
      return;
    }

    setResetting(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to reset context data.");
        setResetting(false);
        return;
      }

      // Delete the session
      await axios.delete(`${url}/api/context-session`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000
      });

      // Clear local state
      setMessages([]);
      setFinalContext("");
      setShowFinalContext(false);
      setSessionStage("collecting");
      setInputMessage("");

      // Reload session to get fresh start with new initial message
      await loadSession();
      setMessage("✅ Context session reset successfully! You can now start a new conversation.");
    } catch (err) {
      console.error("Reset error:", err);
      setMessage("❌ Failed to reset session. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  // Save widget settings
  const saveWidgetSettings = async () => {
    setSavingWidget(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to save widget settings.");
        setSavingWidget(false);
        return;
      }

      const response = await axios.put(
        `${url}/api/user/widget-settings`,
        { widgetSettings },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );

      if (response.data && response.data.widgetSettings) {
        // Update local state with saved settings
        setWidgetSettings(response.data.widgetSettings);
      }
      
      setMessage("✅ Widget settings saved successfully!");
    } catch (err) {
      console.error("Save widget settings error:", err);
      if (err.response?.status === 404) {
        setMessage("❌ Widget settings endpoint not found. Please restart the backend server.");
      } else {
        const errorMsg = err.response?.data?.error || err.message || "Failed to save widget settings.";
        setMessage(`❌ ${errorMsg}`);
      }
    } finally {
      setSavingWidget(false);
    }
  };

  // Load both in parallel on mount (non-blocking)
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setMessage("Please login to manage your context data.");
      setLoading(false);
      return;
    }
    
    // Load both in parallel without blocking
    Promise.all([
      loadSession(),
      loadWidgetSettings()
    ]).catch(err => {
      console.error("Initial load error:", err);
    });
  }, [loadSession, loadWidgetSettings]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setSending(true);
    setMessage("");

    // Add user message to chat
    setMessages(prev => [...prev, { type: "user", content: userMessage }]);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to send messages.");
        setSending(false);
        return;
      }

      const { data } = await retryRequest(async () => {
        return await axios.post(
          `${url}/api/context-session/message`,
          { message: userMessage },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 25000
          }
        );
      });

      // Add AI response to chat
      setMessages(prev => [...prev, { type: "ai", content: data.reply }]);

      // If done, show final context
      if (data.done) {
        setSessionStage("complete");
        // Format collected data into readable text
        const contextSummary = formatContext(data.collectedData);
        setFinalContext(contextSummary);
        setShowFinalContext(true);
        setMessage("✅ Context setup complete! You can now review and edit the summary below.");
      }
    } catch (err) {
      console.error("Send message error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to send message. Please try again.";
      setMessage(`❌ ${errorMsg}`);
      setMessages(prev => [...prev, { 
        type: "ai", 
        content: "Sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setSending(false);
    }
  };

  const saveFinalContext = async () => {
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to save context data.");
        setSaving(false);
        return;
      }

      await axios.post(
        `${url}/api/context-session/complete`,
        { finalContext },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessage("✅ Context data saved successfully! Your chatbot will now use this information.");
    } catch (err) {
      console.error("Save context error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to save context data. Please try again.";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-800">Manage Your Chatbot Context</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={loading || resetting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Update
            </button>
            <button
              onClick={handleReset}
              disabled={loading || resetting}
              className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
              Reset
            </button>
          </div>
        </div>

        {loading && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            <span className="text-sm text-blue-700">Loading context session...</span>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          {sessionStage === "collecting" 
            ? "I'll ask you some questions about your business or service to gather context information. Let's get started!"
            : "Your context data has been collected. Review and edit it below, then save to use it with your chatbot."}
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              message.startsWith("✅")
                ? "bg-green-100 text-green-700"
                : message.startsWith("❌") || message.startsWith("⚠️")
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <span>{message}</span>
          </div>
        )}

        {/* Chat Interface */}
        {sessionStage === "collecting" && !showFinalContext && (
          <div className="mb-6">
            <div className="border rounded-lg h-96 bg-gray-50 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth" style={{ maxHeight: "calc(100% - 80px)" }}>
              {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.type === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {msg.type === "ai" && (
                          <MessageCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4 bg-white rounded-b-lg">
                <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey && e.ctrlKey) {
                      e.preventDefault();
                      const textarea = e.target;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const newValue =
                        inputMessage.substring(0, start) + "\n" + inputMessage.substring(end);
                      setInputMessage(newValue);
                      setTimeout(() => {
                        textarea.selectionStart = textarea.selectionEnd = start + 1;
                      }, 0);
                    } else if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your answer here..."
                  className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm"
                  style={{
                    maxHeight: "6.5rem", // roughly 3 lines
                    minHeight: "2.5rem",
                    overflowY: inputMessage.split("\n").length > 3 ? "auto" : "hidden",
                  }}
                  rows={1}
                  disabled={sending}
                />

                  <button
                    onClick={sendMessage}
                    disabled={sending || !inputMessage.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final Context Summary */}
        {showFinalContext && (
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Context Summary (Review and edit if needed)
            </label>
            <textarea
              value={finalContext}
              onChange={(e) => setFinalContext(e.target.value)}
              placeholder="Context summary will appear here..."
              className="w-full h-96 px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono text-sm"
            />
            <button
              onClick={saveFinalContext}
              disabled={saving}
              className="mt-4 flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Context Data"}
            </button>
          </div>
        )}
      </div>

      {/* Widget Customization Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">Widget Customization</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Customize the appearance of your chatbot widget. These settings will be applied to the widget when embedded on your website.
        </p>

        <div className="space-y-6">
          {/* Widget Button Color */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Widget Button Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={widgetSettings.widgetColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, widgetColor: e.target.value})}
                className="w-16 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={widgetSettings.widgetColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, widgetColor: e.target.value})}
                className="flex-1 px-4 py-2 border rounded-md"
                placeholder="#667eea"
              />
            </div>
          </div>

          {/* Logo/Icon Color */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Logo/Icon Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={widgetSettings.logoColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, logoColor: e.target.value})}
                className="w-16 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={widgetSettings.logoColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, logoColor: e.target.value})}
                className="flex-1 px-4 py-2 border rounded-md"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Chat Window Color */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Chat Window Background Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={widgetSettings.chatWindowColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, chatWindowColor: e.target.value})}
                className="w-16 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={widgetSettings.chatWindowColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, chatWindowColor: e.target.value})}
                className="flex-1 px-4 py-2 border rounded-md"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Header Color */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Header Background Color
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="color"
                value={widgetSettings.headerColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, headerColor: e.target.value})}
                className="w-16 h-10 border rounded cursor-pointer"
              />
              <input
                type="text"
                value={widgetSettings.headerColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, headerColor: e.target.value})}
                className="flex-1 px-4 py-2 border rounded-md"
                placeholder="#667eea"
              />
            </div>
          </div>

          {/* Header Text */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Header Text (Editable)
            </label>
            <input
              type="text"
              value={widgetSettings.headerText}
              onChange={(e) => setWidgetSettings({...widgetSettings, headerText: e.target.value})}
              className="w-full px-4 py-2 border rounded-md"
              placeholder="QueryMate"
            />
            <p className="text-xs text-gray-500 mt-1">
              This text will appear in the widget header
            </p>
          </div>

          {/* Powered By Text (Read-only) */}
          {/* <div>
            <label className="block text-gray-700 font-medium mb-2">
              Powered By Text (Not Editable)
            </label>
            <input
              type="text"
              value={widgetSettings.poweredByText}
              readOnly
              className="w-full px-4 py-2 border rounded-md bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              This text will appear below the header and cannot be changed
            </p>
          </div> */}
        </div>

        <button
          onClick={saveWidgetSettings}
          disabled={savingWidget}
          className="mt-6 flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {savingWidget ? "Saving..." : "Save Widget Settings"}
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-800 mb-2">
            <strong>💡 Note:</strong> After customizing your widget, visit the{" "}
            <Link
              href="/integration"
              className="text-indigo-600 hover:text-indigo-700 underline font-semibold"
            >
              Integration page
            </Link>
            {" "}to get your API key and embed code.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContextPage;
