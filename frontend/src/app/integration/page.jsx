"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import { Code, Globe, Copy, Check, ArrowLeft, Key, Loader } from "lucide-react";

function IntegrationPage() {
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "https://querymate-backend-sz0d.onrender.com";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      const email = localStorage.getItem("userEmail");
      setIsLoggedIn(!!token);
      setUserEmail(email || "");
      
      if (token) {
        loadApiKey(token);
      }
    }
  }, []);

  const loadApiKey = async (token) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${url}/api/user/api-key`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      setApiKey(data.apiKey || "");
    } catch (err) {
      console.error("Load API key error:", err);
      // Silently fail - user can generate new key
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setGenerating(true);
    setMessage("");
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage("Please login to generate API key.");
        setGenerating(false);
        return;
      }

      const { data } = await axios.post(
        `${url}/api/user/api-key`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );

      setApiKey(data.apiKey);
      setMessage("✅ API key generated successfully! Your API key includes your email hash for uniqueness.");
    } catch (err) {
      console.error("Generate API key error:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to generate API key.";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    const widgetCode = apiKey 
      ? `<script src="${url.endsWith('/api') ? url.replace('/api', '') : url}/widget.js" data-api-key="${apiKey}"></script>`
      : `<script src="${url.endsWith('/api') ? url.replace('/api', '') : url}/widget.js" data-api-key="YOUR_API_KEY_HERE"></script>`;
    
    navigator.clipboard.writeText(widgetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/context"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Context Management
        </Link>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">Widget Integration Guide</h1>
          </div>

          <p className="text-gray-600 mb-8">
            Follow these simple steps to add the QueryMate chatbot widget to your website. The widget will use your saved context data to answer questions from your visitors.
          </p>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Step 1: Get Your API Key
              </h2>
              <p className="text-gray-600 mb-4">
                {isLoggedIn 
                  ? "Generate your API key below. Your API key will include your email hash for uniqueness."
                  : "First, you need to login and generate an API key. Your API key will include your email hash for uniqueness."}
              </p>
              
              {isLoggedIn ? (
                <div className="space-y-4">
                  {message && (
                    <div className={`p-3 rounded-md text-sm ${
                      message.startsWith("✅") 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {message}
                    </div>
                  )}
                  
                  {loading ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Loading API key...</span>
                    </div>
                  ) : apiKey ? (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={apiKey}
                          readOnly
                          className="flex-1 px-4 py-2 border rounded-md bg-gray-50 text-gray-700 font-mono text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition flex items-center gap-2"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        💡 Your API key format: <code className="bg-gray-100 px-1 rounded">qm_[email_hash]_[random]</code> - The email hash ensures uniqueness per user.
                      </p>
                      <button
                        onClick={generateApiKey}
                        disabled={generating}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        {generating ? "Regenerating..." : "Regenerate API Key"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={generateApiKey}
                      disabled={generating}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      {generating ? "Generating..." : "Generate API Key"}
                    </button>
                  )}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Your API key is unique to your account ({userEmail}). Each user gets a unique API key that includes their email hash for identification.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                  >
                    Login to Generate API Key
                  </Link>
                  <p className="text-sm text-gray-500">
                    Or <Link href="/signup" className="text-indigo-600 hover:underline">sign up</Link> if you don't have an account yet.
                  </p>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Step 2: Copy the Widget Code
              </h2>
              <p className="text-gray-600 mb-4">
                {apiKey 
                  ? "Copy your widget code below (your API key is already included):"
                  : "Once you have your API key, copy the widget code. It will look like this:"}
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm relative">
                <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                  {apiKey 
                    ? `<script src="${url.endsWith('/api') ? url.replace('/api', '') : url}/widget.js" data-api-key="${apiKey}"></script>`
                    : `<script src="${url.endsWith('/api') ? url.replace('/api', '') : url}/widget.js" data-api-key="YOUR_API_KEY_HERE"></script>`}
                </pre>
                <button
                  onClick={copyCode}
                  disabled={!apiKey}
                  className="absolute top-2 right-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 transition flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {!apiKey && (
                <p className="text-sm text-yellow-600 mt-2">
                  ⚠️ Please generate your API key in Step 1 first.
                </p>
              )}
            </div>

            {/* Step 3 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Step 3: Add to Your Website
              </h2>
              <p className="text-gray-600 mb-4">
                Paste the code into your website's HTML, just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">For HTML Websites:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Open your HTML file in a text editor</li>
                  <li>Find the <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code> tag at the bottom</li>
                  <li>Paste the widget code just before it</li>
                  <li>Save the file</li>
                </ol>
              </div>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">For WordPress:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Go to Appearance → Theme Editor</li>
                  <li>Select "Theme Footer" (footer.php)</li>
                  <li>Find the <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code> tag</li>
                  <li>Paste the code just before it</li>
                  <li>Click "Update File"</li>
                </ol>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-800 mb-2">For React/Next.js/Vue:</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                  <li>Add the script to your main layout or _document.js file</li>
                  <li>Use Next.js Script component or useEffect to load it</li>
                  <li>Or add it to your public/index.html</li>
                </ol>
              </div>
            </div>

            {/* Step 4 */}
            <div className="border-l-4 border-indigo-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Step 4: Test Your Widget
              </h2>
              <p className="text-gray-600 mb-4">
                After adding the code, refresh your website. You should see a chat button in the bottom-right corner. Click it to test the chatbot!
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="mt-8 p-6 bg-yellow-50 rounded-md border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-3">⚠️ Important Notes:</h3>
            <ul className="list-disc list-inside text-sm text-yellow-800 space-y-2">
              <li>Make sure you've saved your context data before generating the API key</li>
              <li>The widget will use your latest saved context data</li>
              <li>Keep your API key secure - don't share it publicly</li>
              <li>Your API key includes your email hash (first 8 characters) for uniqueness - format: <code className="bg-yellow-100 px-1 rounded">qm_[email_hash]_[random]</code></li>
              <li>Each user account gets a unique API key tied to their email address</li>
              <li>You can regenerate your API key anytime from the Context page or here</li>
              <li>The widget works on any website - HTML, WordPress, React, Vue, etc.</li>
            </ul>
          </div>

          {/* Support */}
          <div className="mt-8 p-6 bg-indigo-50 rounded-md border border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-2">Need Help?</h3>
            <p className="text-sm text-indigo-700">
              If you encounter any issues, make sure:
            </p>
            <ul className="list-disc list-inside text-sm text-indigo-700 mt-2 space-y-1">
              <li>Your API key is correct and active</li>
              <li>You've saved your context data</li>
              <li>The code is placed before the closing &lt;/body&gt; tag</li>
              <li>Your website allows external scripts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntegrationPage;

