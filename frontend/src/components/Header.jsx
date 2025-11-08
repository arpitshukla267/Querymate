"use client";
import React from "react";
import Link from "next/link";
import { MessageCircle, User, LogIn, UserPlus } from "lucide-react";

function Header() {
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
      </nav>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}

export default Header;
