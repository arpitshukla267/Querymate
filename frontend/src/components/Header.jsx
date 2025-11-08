"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, User, LogIn, UserPlus, LogOut, Settings, Code } from "lucide-react";

function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      const email = localStorage.getItem("userEmail");
      setIsLoggedIn(!!token);
      setUserEmail(email || "");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    setUserEmail("");
    router.push("/");
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
      {/* Logo / Brand */}
      <Link href="/" className="flex items-center gap-2">
        <MessageCircle className="w-8 h-8" />
        <h1 className="text-2xl font-bold tracking-wide">QueryMate</h1>
      </Link>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/features" className="hover:text-gray-200">
          Features
        </Link>
        <Link href="/pricing" className="hover:text-gray-200">
          Pricing
        </Link>
        <Link href="/about" className="hover:text-gray-200">
          About
        </Link>
        <Link href="/contact" className="hover:text-gray-200">
          Contact
        </Link>
        {isLoggedIn && (
          <>
            <Link href="/context" className="hover:text-gray-200 flex items-center gap-1">
              <Settings className="w-4 h-4" />
              Context
            </Link>
            <Link href="/integration" className="hover:text-gray-200 flex items-center gap-1">
              <Code className="w-4 h-4" />
              Integration
            </Link>
          </>
        )}
      </nav>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <span className="hidden md:block text-sm text-gray-200">
              {userEmail}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-4 py-2 rounded-full border border-white/60 hover:bg-white hover:text-indigo-600 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="flex items-center gap-1 px-4 py-2 rounded-full border border-white/60 hover:bg-white hover:text-indigo-600 transition"
            >
              <LogIn className="w-4 h-4" /> Login
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-yellow-400 text-indigo-700 font-semibold hover:bg-yellow-300 transition"
            >
              <UserPlus className="w-4 h-4" /> Signup
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
