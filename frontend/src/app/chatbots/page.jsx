"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getBackendUrl, getAuthToken, isAuthenticated } from "@/lib/utils";
import {
  Bot,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Code,
  Power,
  PowerOff,
  ExternalLink,
  MessageSquare,
  Minimize2,
  Send,
} from "lucide-react";
import { DemoModeModal, isAiServiceError } from "@/components/ui/DemoModeModal";

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

export default function ChatbotsPage() {
  const router = useRouter();
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Chatbot Preview State
  const [showChatPreview, setShowChatPreview] = useState(false);
  const [previewChatbot, setPreviewChatbot] = useState(null);
  const [previewMessages, setPreviewMessages] = useState([]);
  const [previewInput, setPreviewInput] = useState("");
  const [previewThinking, setPreviewThinking] = useState(false);
  const previewEndRef = useRef(null);

  const openChatPreview = (chatbot) => {
    setPreviewChatbot(chatbot);
    setShowChatPreview(true);
    setPreviewMessages([
      {
        role: "assistant",
        content: chatbot.welcomeMessage || "Hello! How can I help you today?",
      },
    ]);
    setPreviewInput("");
  };

  const sendPreviewMessage = async () => {
    if (!previewInput.trim() || previewThinking || !previewChatbot) return;

    const userMsg = previewInput.trim();
    setPreviewInput("");
    setPreviewMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setPreviewThinking(true);

    try {
      const url = getBackendUrl();
      const apiKey = previewChatbot.apiKey || previewChatbot.api_key;
      const response = await axios.post(
        `${url}/api/chat/public`,
        { message: userMsg },
        { headers: { "X-API-Key": apiKey } }
      );

      if (response.data.reply) {
        setPreviewMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.reply },
        ]);
      }
    } catch (err) {
      if (isAiServiceError(err)) {
        setShowDemoModal(true);
      }
      console.error("Preview chat error:", err);
      setPreviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setPreviewThinking(false);
    }
  };

  const handlePreviewKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPreviewMessage();
    }
  };

  // Scroll preview to bottom
  useEffect(() => {
    if (showChatPreview) {
      previewEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [previewMessages, previewThinking, showChatPreview]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchChatbots();
  }, [router]);

  const fetchChatbots = async () => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const response = await axios.get(`${url}/api/chatbots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.chatbots) {
        setChatbots(response.data.chatbots);
      }
    } catch (err) {
      console.error("Error fetching chatbots:", err);
      toast("Failed to load chatbots", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteChatbot = async (chatbotId) => {
    if (!confirm("Are you sure you want to delete this chatbot?")) return;

    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      await axios.delete(`${url}/api/chatbots/${chatbotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast("Chatbot deleted successfully", "success");
      fetchChatbots();
    } catch (err) {
      console.error("Error deleting chatbot:", err);
      toast("Failed to delete chatbot", "error");
    }
  };

  const toggleChatbot = async (chatbotId, currentStatus) => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      await axios.put(
        `${url}/api/chatbots/${chatbotId}`,
        { isEnabled: !currentStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast(
        `Chatbot ${!currentStatus ? "enabled" : "disabled"} successfully`,
        "success"
      );
      fetchChatbots();
    } catch (err) {
      console.error("Error toggling chatbot:", err);
      toast("Failed to update chatbot", "error");
    }
  };

  const showEmbedScript = (chatbot) => {
    setSelectedChatbot(chatbot);
    setShowScriptModal(true);
    setCopied(false);
  };

  const copyScript = async () => {
    if (!selectedChatbot) return;

    const backendUrl = getBackendUrl();
    const script = `<script src="${backendUrl}/widget.js" data-api-key="${selectedChatbot.apiKey}"></script>`;

    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast("Script copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast("Failed to copy script", "error");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
            My Chatbots
          </h1>
          <p className="text-[rgb(var(--color-text-secondary))]">
            Manage and customize your AI chatbots.
          </p>
        </div>
        <Link href="/personalize-chatbot">
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Personalize New Chatbot
          </Button>
        </Link>
      </div>

      {/* Chatbots Grid */}
      {chatbots.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-[rgb(var(--color-text-secondary))]" />
            <h3 className="text-xl font-semibold mb-2 text-[rgb(var(--color-text-primary))]">
              No Chatbots Yet
            </h3>
            <p className="text-[rgb(var(--color-text-secondary))] mb-6">
              Create your first AI chatbot to get started.
            </p>
            <Link href="/personalize-chatbot">
              <Button variant="primary" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Personalize Your First Chatbot
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatbots.map((chatbot) => (
            <Card key={chatbot._id} hover>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: chatbot.themeColor + "20" }}
                    >
                      <Bot
                        className="w-6 h-6"
                        style={{ color: chatbot.themeColor }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{chatbot.name}</CardTitle>
                      <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                        {chatbot.businessName || "No business name"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
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
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-[rgb(var(--color-text-secondary))]">
                  <p className="truncate">
                    <strong>Tone:</strong> {chatbot.tone}
                  </p>
                  <p className="truncate">
                    <strong>Language:</strong> {chatbot.language}
                  </p>
                  {chatbot.services.length > 0 && (
                    <p className="truncate">
                      <strong>Services:</strong> {chatbot.services.length}
                    </p>
                  )}
                  {chatbot.faqs.length > 0 && (
                    <p className="truncate">
                      <strong>FAQs:</strong> {chatbot.faqs.length}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => openChatPreview(chatbot)}
                    className="w-full flex items-center justify-center text-white font-semibold shadow-md transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
                    style={{
                      backgroundColor: chatbot.themeColor,
                      borderColor: chatbot.themeColor,
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Try Chatbot
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-[rgb(var(--color-border))]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleChatbot(chatbot._id, chatbot.isEnabled)}
                    className="flex-1"
                  >
                    {chatbot.isEnabled ? (
                      <>
                        <PowerOff className="w-4 h-4 mr-1" />
                        Disable
                      </>
                    ) : (
                      <>
                        <Power className="w-4 h-4 mr-1" />
                        Enable
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => showEmbedScript(chatbot)}
                    className="flex-1"
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Script
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/chatbots/${chatbot._id}`)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteChatbot(chatbot._id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Embed Script Modal */}
      <Modal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Embed Script"
        size="lg"
      >
        {selectedChatbot && (
          <div className="space-y-4">
            <p className="text-[rgb(var(--color-text-secondary))]">
              Copy this script and paste it before the closing{" "}
              <code className="bg-[rgb(var(--color-surface))] px-2 py-1 rounded">
                &lt;/body&gt;
              </code>{" "}
              tag on your website.
            </p>

            <div className="relative">
              <pre className="bg-[rgb(var(--color-surface))] p-4 rounded-lg overflow-x-auto border border-[rgb(var(--color-border))]">
                <code className="text-sm text-[rgb(var(--color-text-primary))]">
                  {`<script src="${getBackendUrl()}/widget.js" data-api-key="${selectedChatbot.apiKey}"></script>`}
                </code>
              </pre>
              <Button
                onClick={copyScript}
                variant="primary"
                size="sm"
                className="absolute top-2 right-2"
              >
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

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> Make sure to replace YOUR_API_KEY with your actual
                API key. The script will automatically load the chatbot widget on your
                website.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Chatbot Preview Panel */}
      {showChatPreview && previewChatbot && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            bottom: "24px",
            right: previewChatbot.position === "bottom-left" ? "auto" : "24px",
            left: previewChatbot.position === "bottom-left" ? "24px" : "auto",
            width: "380px",
            maxHeight: "560px",
          }}
        >
          <div
            className="flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-[rgb(var(--color-border))]"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ backgroundColor: previewChatbot.themeColor }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {previewChatbot.name || previewChatbot.businessName || "My Chatbot"}
                  </p>
                  <p className="text-xs text-white/70">Online</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatPreview(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[rgb(var(--color-surface))]">
              {previewMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-primary))] border border-[rgb(var(--color-border))]"
                    }`}
                    style={
                      msg.role === "user" ? { backgroundColor: previewChatbot.themeColor } : {}
                    }
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {previewThinking && (
                <div className="flex justify-start">
                  <div className="bg-[rgb(var(--color-surface-elevated))] border border-[rgb(var(--color-border))] rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: previewChatbot.themeColor, animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: previewChatbot.themeColor, animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: previewChatbot.themeColor, animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={previewEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  onKeyPress={handlePreviewKeyPress}
                  placeholder="Type a message..."
                  disabled={previewThinking}
                  className="flex-1 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-primary))] text-sm rounded-full px-4 py-2.5 border border-[rgb(var(--color-border))] focus:outline-none focus:ring-2 disabled:opacity-50 placeholder:text-[rgb(var(--color-text-secondary))]"
                  style={{ focusRingColor: previewChatbot.themeColor }}
                />
                <button
                  onClick={sendPreviewMessage}
                  disabled={!previewInput.trim() || previewThinking}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 hover:opacity-90 shrink-0"
                  style={{ backgroundColor: previewChatbot.themeColor }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Mode Modal */}
      <DemoModeModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
}

