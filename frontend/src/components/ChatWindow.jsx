"use client";

import axios from "axios";
import React, { useState, useRef, useEffect } from "react";

function ChatWindow() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputHeight, setInputHeight] = useState("auto"); // Initial height

  const textareaRef = useRef(null);

  // Backend URL
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setInput("");
    setInputHeight("auto"); // Reset height after sending
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${url}/api/chat`,
        { message: input },
        { withCredentials: true }
      );

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "⚠️ Sorry, I couldn’t process that." },
        ]);
      }
    } catch (err) {
      console.error(err);
      const serverMsg = err?.response?.data?.error || "Error connecting to server.";
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `❌ ${serverMsg}` },
      ]);
    }

    setLoading(false);
  };

  // Handle key presses in textarea
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      sendMessage();
    }
    // Shift+Enter naturally adds a newline, no preventDefault needed
  };

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      setInputHeight(textareaRef.current.style.height);
    }
  }, [input]);

  return (
    <div className="w-full max-w-3xl bg-gray-200 shadow-md rounded-lg flex flex-col h-[70vh]">
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="mb-4">
            <p
              className={`font-semibold ${
                msg.role === "bot" ? "text-indigo-600" : "text-gray-800"
              }`}
            >
              {msg.role === "bot" ? "QueryMate" : "You"}
            </p>
            <p
              className={`p-2 rounded-md ${
                msg.role === "bot" ? "bg-gray-100" : "bg-indigo-100"
              } whitespace-pre-wrap`}
            >
              {msg.text}
            </p>
          </div>
        ))}
        {loading && <p className="text-gray-500 italic">QueryMate is typing...</p>}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t flex gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message"
          className="flex-1 px-4 py-2 rounded-full focus:shadow-lg bg-white focus:outline-none resize-none overflow-y-auto"
          style={{
            height: inputHeight,
            maxHeight: '144px', // allow ~6 lines
            overflowY: 'auto'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
