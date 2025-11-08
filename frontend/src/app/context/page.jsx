"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { Save, FileText, Key, Copy, Check, Code } from "lucide-react";

function ContextPage() {
  const [contextData, setContextData] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "https://querymate-backend-sz0d.onrender.com";

  useEffect(() => {
    loadContext();
  }, []);

  const loadContext = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to manage your context data.");
        setLoading(false);
        return;
      }

      const { data } = await axios.get(`${url}/api/user/context`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // Reduced timeout to 10 seconds
      });

      setContextData(data.contextData || "");
      setApiKey(data.apiKey || "");
    } catch (err) {
      console.error("Load context error:", err);
      let errorMsg = "Failed to load context data. ";
      
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
      // Still show the page even if loading fails - allow user to work with empty data
      setContextData("");
      setApiKey("");
    } finally {
      // Always stop loading, even on error, so page can render
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadContext();
  };

  const saveContext = async () => {
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
        `${url}/api/user/context`,
        { contextData },
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
          <p className="text-gray-500">Loading context data...</p>
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
          Enter information about your business, products, or services. This data will be used by
          QueryMate to provide personalized answers to your users. Replace the default KnectHotel
          data with your own information.
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
            <div className="flex items-center justify-between">
              <span>{message}</span>
              {(message.startsWith("❌") || message.startsWith("⚠️")) && (
                <button
                  onClick={handleRetry}
                  className="ml-2 px-3 py-1 bg-white text-red-700 rounded text-xs font-semibold hover:bg-red-50 transition"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Context Data (Information for your chatbot)
          </label>
          <textarea
            value={contextData}
            onChange={(e) => setContextData(e.target.value)}
            placeholder="Enter your business information, product details, FAQs, or any data you want the chatbot to use when answering questions..."
            className="w-full h-96 px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        </div>

        <button
          onClick={saveContext}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? "Saving..." : "Save Context Data"}
        </button>
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

