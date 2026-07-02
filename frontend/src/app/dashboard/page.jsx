"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getBackendUrl, getAuthToken, isAuthenticated } from "@/lib/utils";
import { Bot, MessageSquare, Plus, ArrowRight, TrendingUp, Activity } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    chatbotsCount: 0,
    conversationsCount: 0,
  });
  const [recentChatbots, setRecentChatbots] = useState([]);
  const [userEmail, setUserEmail] = useState("");

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

      // Fetch user profile with stats
      const profileRes = await axios.get(`${url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (profileRes.data.stats) {
        setStats(profileRes.data.stats);
      }

      // Fetch recent chatbots
      const chatbotsRes = await axios.get(`${url}/api/chatbots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (chatbotsRes.data.chatbots) {
        setRecentChatbots(chatbotsRes.data.chatbots.slice(0, 5));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
          Welcome back{userEmail ? `, ${userEmail.split("@")[0]}` : ""}! 👋
        </h1>
        <p className="text-[rgb(var(--color-text-secondary))]">
          Here's what's happening with your chatbots today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-1">
                  Total Chatbots
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--color-text-primary))]">
                  {stats.chatbotsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-1">
                  Total Conversations
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--color-text-primary))]">
                  {stats.conversationsCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[rgb(var(--color-text-secondary))] mb-1">
                  Active Chatbots
                </p>
                <p className="text-3xl font-bold text-[rgb(var(--color-text-primary))]">
                  {recentChatbots.filter((c) => c.isEnabled).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started quickly with these actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/personalize-chatbot">
              <Button variant="primary" className="w-full justify-between" size="lg">
                <span className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Chatbot
                </span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary" className="w-full justify-between" size="lg">
                <span className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start AI Support Chat
                </span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/chatbots">
              <Button variant="outline" className="w-full justify-between" size="lg">
                <span className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  Manage Chatbots
                </span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Chatbots */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Chatbots</CardTitle>
                <CardDescription>Your latest chatbot creations</CardDescription>
              </div>
              {recentChatbots.length > 0 && (
                <Link href="/chatbots">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {recentChatbots.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--color-text-secondary))]" />
                <p className="text-[rgb(var(--color-text-secondary))] mb-4">
                  You haven't created any chatbots yet.
                </p>
                <Link href="/personalize-chatbot">
                  <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Personalize Your First Chatbot
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentChatbots.map((chatbot) => (
                  <Link
                    key={chatbot._id}
                    href={`/chatbots/${chatbot._id}`}
                    className="block p-4 rounded-lg border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-surface))] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: chatbot.themeColor + "20" }}
                        >
                          <Bot
                            className="w-5 h-5"
                            style={{ color: chatbot.themeColor }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                            {chatbot.name}
                          </h3>
                          <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                            {chatbot.businessName || "No business name"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {chatbot.isEnabled ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

