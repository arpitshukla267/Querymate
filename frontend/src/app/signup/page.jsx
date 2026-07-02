"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBackendUrl, setAuth, isAuthenticated } from "@/lib/utils";
import { UserPlus, Bot, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const url = getBackendUrl();
      const { data } = await axios.post(`${url}/api/register`, { name, email, password });

      if (data.token) {
        setAuth(data.token, data.user.email);
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:flex flex-col items-center justify-center text-center space-y-6 text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center border border-white/30">
            <Bot className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">QueryMate</h1>
            <p className="text-purple-200 text-lg">
              Premium AI Chatbot Platform
            </p>
          </div>
          <div className="flex items-center space-x-2 text-purple-200">
            <Sparkles className="w-5 h-5" />
            <span>Build powerful AI chatbots in minutes</span>
          </div>
        </div>

        {/* Right side - Signup form */}
        <div className="bg-[rgb(var(--color-surface-elevated))] rounded-2xl shadow-2xl p-8 border border-[rgb(var(--color-border))]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-[rgb(var(--color-primary))] mx-auto mb-4 flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
              Create Account
            </h2>
            <p className="text-[rgb(var(--color-text-secondary))]">
              Sign up to start building AI chatbots
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">    
            <Input
              label="Name"
              type="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={6}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>

          <p className="text-sm text-[rgb(var(--color-text-secondary))] mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-[rgb(var(--color-primary))] hover:underline font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
