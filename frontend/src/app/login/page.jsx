"use client";
import React, { useState } from "react";
import { LogIn } from "lucide-react";
import Image from "next/image";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login with:", { email, password });
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Image */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-white p-8">
        <Image
          src="https://i.pinimg.com/1200x/e0/aa/ce/e0aace4e8ac951195fbbd1a97b0c1d87.jpg"
          alt="Chat illustration"
          width={600}
          height={600}
          className="object-cover w-full h-full"
        />
      </div>


      {/* Right side - Login form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-white">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <LogIn className="w-12 h-12 text-indigo-600 mx-auto" />
            <h1 className="text-3xl font-bold text-gray-800">Login to QueryMate</h1>
            <p className="text-gray-500 text-sm">Welcome back! Please login to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-400"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-md font-semibold hover:bg-indigo-500 transition"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-4 text-center">
            Don’t have an account?{" "}
            <a href="/signup" className="text-indigo-600 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
