"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBackendUrl, getAuthToken, isAuthenticated, clearAuth } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";
import { Palette, Key, Copy, Check, RefreshCw, User, LogOut } from "lucide-react";

function toast(message, type = "info") {
  const toastDiv = document.createElement("div");
  toastDiv.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
    type === "success"
      ? "bg-green-500 text-white"
      : type === "error"
      ? "bg-red-500 text-white"
      : "bg-blue-500 text-white"
  }`;
  toastDiv.textContent = message;
  document.body.appendChild(toastDiv);
  setTimeout(() => toastDiv.remove(), 3000);
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (typeof window !== "undefined") {
      setUserEmail(localStorage.getItem("userEmail") || "");
    }

    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      // Fetch profile
      const profileRes = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.data) {
        setUserEmail(profileRes.data.user?.email || "");
        setUserStats(profileRes.data.stats);
      }

      // Fetch API key
      const keyRes = await axios.get(`${url}/api/user/api-key`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (keyRes.data.apiKey) {
        setApiKey(keyRes.data.apiKey);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setGenerating(true);
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const response = await axios.post(
        `${url}/api/user/api-key`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.apiKey) {
        setApiKey(response.data.apiKey);
        toast("API key generated successfully!", "success");
      }
    } catch (err) {
      console.error("Error generating API key:", err);
      toast("Failed to generate API key", "error");
    } finally {
      setGenerating(false);
    }
  };

  const copyApiKey = async () => {
    if (!apiKey) return;

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast("API key copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast("Failed to copy API key", "error");
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
          Settings
        </h1>
        <p className="text-[rgb(var(--color-text-secondary))]">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-primary))]">
              Email
            </label>
            <Input value={userEmail} disabled className="bg-[rgb(var(--color-surface))]" />
          </div>

          {userStats && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[rgb(var(--color-border))]">
              <div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-1">
                  Total Chatbots
                </p>
                <p className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">
                  {userStats.chatbotsCount || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-1">
                  Total Conversations
                </p>
                <p className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">
                  {userStats.conversationsCount || 0}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[rgb(var(--color-text-primary))]">
                Theme
              </p>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                Switch between light and dark mode
              </p>
            </div>
            <Button onClick={toggleTheme} variant="outline">
              {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <CardTitle>API Key</CardTitle>
          </div>
          <CardDescription>
            Your API key for embedding widgets (legacy - new chatbots have their own keys)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKey ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  value={apiKey}
                  readOnly
                  className="font-mono text-sm bg-[rgb(var(--color-surface))]"
                />
                <Button onClick={copyApiKey} variant="outline">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Button
                onClick={generateApiKey}
                variant="outline"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate API Key
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                You don't have an API key yet. Generate one to get started.
              </p>
              <Button
                onClick={generateApiKey}
                variant="primary"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Generate API Key
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <LogOut className="w-5 h-5 text-red-500" />
            <CardTitle>Logout</CardTitle>
          </div>
          <CardDescription>Sign out of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogout} variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

