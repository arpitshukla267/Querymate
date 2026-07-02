"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { isAuthenticated } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Code,
  Sparkles,
  Lock,
  LogIn,
  UserPlus,
  Bot,
  CheckCircle,
} from "lucide-react";

// Simple toast
function toastMessage(message, type = "info") {
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

const steps = [
  { id: 1, title: "Basic Info", description: "Business details" },
  { id: 2, title: "Description", description: "Tell us about your business" },
  { id: 3, title: "Customize", description: "Tone & appearance" },
  { id: 4, title: "Preview", description: "See your chatbot" },
];

export default function TryBuilderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewMessages, setPreviewMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    websiteUrl: "",
    businessDescription: "",
    tone: "friendly",
    language: "en",
    welcomeMessage: "Hello! How can I help you today?",
    themeColor: "#8B5CF6",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show preview on last step
      setPreviewMode(true);
    }
  };

  const prevStep = () => {
    if (previewMode) {
      setPreviewMode(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetScript = () => {
    if (isAuthenticated()) {
      router.push("/personalize-chatbot");
    } else {
      setShowAuthModal(true);
    }
  };

  const sendPreviewMessage = async (message) => {
    if (!message.trim()) return;

    setPreviewMessages((prev) => [...prev, { role: "user", content: message }]);
    setPreviewMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Thank you for your message: "${message}". This is a preview. Sign up to get your real chatbot with embed script!`,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      {/* Header */}
      <header className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">QueryMate</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGetScript}
              variant="primary"
              className="bg-gradient-to-r from-purple-600 to-purple-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              Get Embed Script
            </Button>
            {!isAuthenticated() ? (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary">Sign Up</Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button variant="primary">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-700/50 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Free Trial</span>
          </div>
          <h1 className="text-4xl font-bold text-[rgb(var(--color-text-primary))] mb-3">
            Try Personalize Chatbot
          </h1>
          <p className="text-lg text-[rgb(var(--color-text-secondary))] max-w-2xl mx-auto">
            Experience building your AI chatbot. Sign up to get the embed script and deploy it on your website.
          </p>
        </div>

        {/* Progress Steps */}
        {!previewMode && (
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      currentStep >= step.id
                        ? "bg-[rgb(var(--color-primary))] text-white"
                        : "bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-secondary))]"
                    }`}
                  >
                    {currentStep > step.id ? "✓" : step.id}
                  </div>
                  <p
                    className={`text-xs mt-2 text-center ${
                      currentStep >= step.id
                        ? "text-[rgb(var(--color-primary))] font-semibold"
                        : "text-[rgb(var(--color-text-secondary))]"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      currentStep > step.id
                        ? "bg-[rgb(var(--color-primary))]"
                        : "bg-[rgb(var(--color-border))]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Preview Mode */}
        {previewMode ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Chatbot Preview</CardTitle>
                <Button variant="outline" onClick={() => setPreviewMode(false)}>
                  Edit Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6 p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[rgb(var(--color-text-primary))] mb-1">
                      Chatbot Configuration Complete!
                    </p>
                    <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                      This is a preview. Sign up to get your embed script and deploy this chatbot on your website.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Preview */}
              <div className="border border-[rgb(var(--color-border))] rounded-xl h-96 flex flex-col">
                {/* Chat Header */}
                <div
                  className="p-4 rounded-t-xl"
                  style={{ backgroundColor: formData.themeColor }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{formData.name || formData.businessName || "My Chatbot"}</p>
                      <p className="text-xs text-white/80">Online</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[rgb(var(--color-surface))]">
                  {previewMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-[rgb(var(--color-primary))] text-white"
                            : "bg-[rgb(var(--color-surface-elevated))] text-[rgb(var(--color-text-primary))] border border-[rgb(var(--color-border))]"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-elevated))] rounded-b-xl">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a message..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          sendPreviewMessage(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={(e) => {
                        const input = e.target.previousElementSibling.querySelector("input");
                        if (input && input.value.trim()) {
                          sendPreviewMessage(input.value);
                          input.value = "";
                        }
                      }}
                      variant="primary"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>

              {/* Get Script CTA */}
              <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-purple-700/50">
                <div className="text-center space-y-4">
                  <Code className="w-12 h-12 mx-auto text-purple-400" />
                  <h3 className="text-2xl font-bold text-[rgb(var(--color-text-primary))]">
                    Ready to Deploy?
                  </h3>
                  <p className="text-[rgb(var(--color-text-secondary))]">
                    Sign up to get your embed script and deploy this chatbot on your website.
                  </p>
                  <div className="flex items-center justify-center space-x-4 pt-2">
                    <Link href="/signup">
                      <Button variant="primary" size="lg">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Sign Up & Get Script
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        <LogIn className="w-5 h-5 mr-2" />
                        Login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Form Content */
          <Card>
            <CardContent className="p-8">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                      Basic Information
                    </h2>
                    <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                      Let's start with the basics about your chatbot.
                    </p>
                  </div>

                  <Input
                    label="Chatbot Name"
                    placeholder="My Support Bot"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />

                  <Input
                    label="Business Name"
                    placeholder="Acme Inc."
                    value={formData.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                  />

                  <Input
                    label="Website URL"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
                  />
                </div>
              )}

              {/* Step 2: Description */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                      Business Description
                    </h2>
                    <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                      Describe what your business does.
                    </p>
                  </div>

                  <Textarea
                    label="Business Description"
                    placeholder="We are a leading provider of innovative solutions..."
                    value={formData.businessDescription}
                    onChange={(e) => handleInputChange("businessDescription", e.target.value)}
                    rows={6}
                  />
                </div>
              )}

              {/* Step 3: Customize */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                      Customize Appearance
                    </h2>
                    <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                      Customize how your chatbot looks and behaves.
                    </p>
                  </div>

                  <Select
                    label="Tone"
                    options={[
                      { value: "formal", label: "Formal" },
                      { value: "friendly", label: "Friendly" },
                      { value: "sales", label: "Sales-Oriented" },
                    ]}
                    value={formData.tone}
                    onChange={(e) => handleInputChange("tone", e.target.value)}
                  />

                  <Input
                    label="Welcome Message"
                    placeholder="Hello! How can I help you today?"
                    value={formData.welcomeMessage}
                    onChange={(e) => handleInputChange("welcomeMessage", e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[rgb(var(--color-text-primary))]">
                      Theme Color
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={formData.themeColor}
                        onChange={(e) => handleInputChange("themeColor", e.target.value)}
                        className="w-16 h-10 rounded border border-[rgb(var(--color-border))] cursor-pointer"
                      />
                      <Input
                        value={formData.themeColor}
                        onChange={(e) => handleInputChange("themeColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Preview */}
              {currentStep === 4 && (
                <div className="space-y-6 text-center">
                  <div>
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                    <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                      Ready to Preview!
                    </h2>
                    <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                      Review your settings and preview your chatbot.
                    </p>
                  </div>

                  <div className="text-left space-y-2 p-4 rounded-lg bg-[rgb(var(--color-surface))]">
                    <p className="font-semibold text-[rgb(var(--color-text-primary))]">
                      Chatbot Name: {formData.name || formData.businessName || "My Chatbot"}
                    </p>
                    <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                      Tone: {formData.tone} • Language: {formData.language}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-700/30">
                    <p className="text-sm text-purple-300 mb-4">
                      <strong className="text-white">Note:</strong> This is a preview. 
                      Sign up to get the embed script and deploy your chatbot!
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgb(var(--color-border))]">
                <Button onClick={prevStep} disabled={currentStep === 1 && !previewMode} variant="outline">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button onClick={nextStep} variant="primary">
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={() => setPreviewMode(true)} variant="primary">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Preview Chatbot
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Auth Required Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In Required"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/30 mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-center text-[rgb(var(--color-text-secondary))]">
            To get your personalized chatbot embed script, please sign up or log in.
          </p>
          <div className="flex space-x-3 pt-4">
            <Link href="/login" className="flex-1">
              <Button variant="outline" className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button variant="primary" className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}

