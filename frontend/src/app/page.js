"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import { X } from "lucide-react";

export default function Home() {
  const router = useRouter();


  

  const handleClose = () => {
    setShowPopup(false);
    localStorage.setItem("querymate-popup-shown", "true");
  };

  const handleLogin = () => {
    handleClose();
    router.push("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-800">
      {/* Welcome Section */}
      <h1 className="text-3xl font-bold mb-4">Welcome to QueryMate 🤖</h1>
      <p className="text-gray-600 mb-6 text-center max-w-lg">
        Your personal AI chatbot powered by Gemini. Start a new chat from the sidebar or continue where you left off.
      </p>

      {/* Chat Window */}
      <ChatWindow />


    </div>
  );
}
