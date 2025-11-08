"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { Save, FileText, Key, Copy, Check, Code, Send, MessageCircle } from "lucide-react";

function ContextPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionStage, setSessionStage] = useState("collecting");
  const [finalContext, setFinalContext] = useState("");
  const [showFinalContext, setShowFinalContext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);

  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "https://querymate-backend-sz0d.onrender.com";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadSession();
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const { data } = await axios.get(`${url}/api/user/context`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      setApiKey(data.apiKey || "");
    } catch (err) {
      console.error("Load API key error:", err);
    }
  };

  const loadSession = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to manage your context data.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${url}/api/context-session`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      });

      setSessionStage(data.session.stage);

      // If user already has context data, show it in read-only mode
      if (data.session.hasExistingContext) {
        const contextData = await axios.get(`${url}/api/user/context`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        setFinalContext(contextData.data.contextData || "");
        setShowFinalContext(true);
        setMessages([
          {
            type: "ai",
            content: "You already have context data set up. You can view and edit it below, or start a new conversation to update it."
          }
        ]);
      } else if (data.session.stage === "complete") {
        // Session is complete, show final context
        const formatContext = (data) => {
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
        errorMsg = "Request timed out. Please check your connection and try again.";
      } else if (err.request) {
        errorMsg = "Unable to connect to server. Please check if the backend is running.";
      } else {
        errorMsg += err.message || "Please try again.";
      }
      
      setMessage(`⚠️ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

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

      const { data } = await axios.post(
        `${url}/api/context-session/message`,
        { message: userMessage },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000
        }
      );

      // Add AI response to chat
      setMessages(prev => [...prev, { type: "ai", content: data.reply }]);

      // If done, show final context
      if (data.done) {
        setSessionStage("complete");
        // Format collected data into readable text
        const formatContext = (data) => {
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

  const generateApiKey = async () => {
    setGeneratingKey(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to generate API key.");
        setGeneratingKey(false);
        return;
      }

      const { data } = await axios.post(
        `${url}/api/user/api-key`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setApiKey(data.apiKey);
      setMessage("✅ API key generated successfully! Your API key includes your email hash for uniqueness.");
    } catch (err) {
      console.error("Generate API key error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to generate API key.";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyWidgetCode = () => {
    const widgetUrl = url.endsWith('/api') ? url.replace('/api', '') : url;
    const widgetCode = `<script src="${widgetUrl}/widget.js" data-api-key="${apiKey}"></script>`;
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading context session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">Manage Your Chatbot Context</h1>
        </div>

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
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Type your answer here..."
                    className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
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

      {/* API Key Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-6 h-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-800">API Key & Widget Integration</h2>
        </div>

        <p className="text-gray-600 mb-6">
          Generate an API key to embed the QueryMate chatbot widget on your website. The widget will use your context data to answer questions.
        </p>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Your API Key</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiKey || "No API key generated yet"}
              readOnly
              className="flex-1 px-4 py-2 border rounded-md bg-gray-50 text-gray-700"
            />
            {apiKey && (
              <button
                onClick={copyApiKey}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
            <button
              onClick={generateApiKey}
              disabled={generatingKey}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingKey ? "Generating..." : apiKey ? "Regenerate Key" : "Generate API Key"}
            </button>
          </div>
        </div>

        {apiKey && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-md">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Embed Widget on Your Website
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Copy and paste this code into your website's HTML (before the closing &lt;/body&gt; tag):
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm relative">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words">
{`<script src="${url.endsWith('/api') ? url.replace('/api', '') : url}/widget.js" data-api-key="${apiKey}"></script>`}
              </pre>
              <button
                onClick={copyWidgetCode}
                className="absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-md border border-indigo-200">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">📋 How to Use:</h4>
              <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                <li>Copy the code above</li>
                <li>Open your website's HTML file or content management system</li>
                <li>Find the &lt;/body&gt; tag (usually at the bottom of the page)</li>
                <li>Paste the code just before &lt;/body&gt;</li>
                <li>Save and publish your website</li>
                <li>The chatbot widget will appear in the bottom-right corner of your website</li>
              </ol>
            </div>

            <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <p className="text-xs text-yellow-800">
                <strong>💡 Note:</strong> Make sure you've saved your context data first! The widget will use your saved context to answer questions from visitors.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-semibold text-gray-800 mb-2">💡 Tips:</h3>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Save your context data first before generating an API key</li>
            <li>Keep your API key secure and don't share it publicly</li>
            <li>You can regenerate your API key at any time</li>
            <li>The widget will use your latest saved context data</li>
            <li>Works on any website - WordPress, HTML, React, Vue, etc.</li>
            <li>The widget automatically adapts to your website's design</li>
          </ul>
        </div>

        {!apiKey && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800 mb-2">
              <strong>🚀 Ready to get started?</strong> First, save your context data above, then generate an API key to get your widget embedding code!
            </p>
            <Link
              href="/integration"
              className="text-sm text-indigo-600 hover:text-indigo-700 underline font-semibold"
            >
              View detailed integration guide →
            </Link>
          </div>
        )}

        {apiKey && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800 mb-2">
              Need help with integration? Check out our detailed guide!
            </p>
            <Link
              href="/integration"
              className="text-sm text-indigo-600 hover:text-indigo-700 underline font-semibold"
            >
              View integration guide →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContextPage;
