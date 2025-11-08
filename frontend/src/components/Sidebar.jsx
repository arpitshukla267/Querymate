"use client";
import React, { useState } from "react";
import { Plus, MessageSquare, User, LogOut, Settings } from "lucide-react";

function Sidebar() {
  const [chats, setChats] = useState([
    { id: 1, title: "Chat with QueryMate" },
    { id: 2, title: "AI Learning Session" },
    { id: 3, title: "Daily Planner" },
  ]);

  const handleNewChat = () => {
    const newChat = { id: Date.now(), title: "New Chat" };
    setChats([newChat, ...chats]);
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-900 text-gray-200 p-3">
      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        className="flex items-center gap-2 px-4 py-2 mb-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium transition"
      >
        <Plus size={18} /> New Chat
      </button>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-800 cursor-pointer"
          >
            <MessageSquare size={16} />
            <span className="truncate">{chat.title}</span>
          </div>
        ))}
      </div>

      {/* User Section */}
      <div className="border-t border-gray-700 pt-3 mt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 bg-gray-700 p-1 rounded-full" />
            <span className="text-sm font-medium">Arpit Shukla</span>
          </div>
          <div className="flex gap-2">
            <Settings className="w-5 h-5 cursor-pointer hover:text-white" />
            <LogOut className="w-5 h-5 cursor-pointer hover:text-red-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
