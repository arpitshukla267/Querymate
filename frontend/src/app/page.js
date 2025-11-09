"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import { X } from "lucide-react";

export default function Home() {
  const [showPopup, setShowPopup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if running inside an iframe (plugin/widget)
    const inIframe = window.self !== window.top;
    if (inIframe) return; // ❌ Don't show popup for embedded versions
  
    const token = localStorage.getItem("authToken");
    const popupShown = localStorage.getItem("querymate-popup-shown");
  
    // Show popup only on main site, once per user
    if (!token && !popupShown) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);
  

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

      {/* Login Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 relative">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                Get Your Free Trial! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                Please login to get a free trial of our personalized chatbot. Create your own AI assistant tailored to your business!
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleLogin}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 transition"
                >
                  Login
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
