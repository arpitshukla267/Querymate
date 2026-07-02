"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { getBackendUrl, getAuthToken, isAuthenticated } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Copy,
  Check,
  Code,
  Sparkles,
} from "lucide-react";

// Simple toast function
function toastMessage(message, type = "info") {
  // You can replace this with a proper toast library
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
  { id: 3, title: "Services", description: "What do you offer?" },
  { id: 4, title: "FAQs", description: "Common questions" },
  { id: 5, title: "Customize", description: "Tone & appearance" },
  { id: 6, title: "Generate", description: "Get your embed script" },
];

export default function ChatbotBuilder() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [copied, setCopied] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    websiteUrl: "",
    businessDescription: "",
    services: [],
    currentService: "",
    faqs: [{ question: "", answer: "" }],
    tone: "friendly",
    language: "en",
    welcomeMessage: "Hello! How can I help you today?",
    themeColor: "#8B5CF6",
    position: "bottom-right",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    if (formData.currentService.trim()) {
      setFormData((prev) => ({
        ...prev,
        services: [...prev.services, prev.currentService.trim()],
        currentService: "",
      }));
    }
  };

  const removeService = (index) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const addFAQ = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const removeFAQ = (index) => {
    if (formData.faqs.length > 1) {
      setFormData((prev) => ({
        ...prev,
        faqs: prev.faqs.filter((_, i) => i !== index),
      }));
    }
  };

  const updateFAQ = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateScript = async () => {
    if (!isAuthenticated()) {
      // Show auth modal if not authenticated
      toastMessage("Please sign in to get your embed script", "error");
      router.push("/login?redirect=/chatbot-builder");
      return;
    }

    const backendUrl = getBackendUrl();
    const script = `<script src="${backendUrl}/widget.js" data-api-key="YOUR_API_KEY"></script>`;
    setGeneratedScript(script);
    setShowScriptModal(true);
  };

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toastMessage("Script copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toastMessage("Failed to copy script", "error");
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated()) {
      toastMessage("Please sign in to create a chatbot", "error");
      router.push("/login?redirect=/chatbot-builder");
      return;
    }

    setLoading(true);
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      // Filter out empty FAQs
      const validFAQs = formData.faqs.filter(
        (faq) => faq.question.trim() && faq.answer.trim()
      );

      const response = await axios.post(
        `${url}/api/chatbots`,
        {
          name: formData.name || formData.businessName || "My Chatbot",
          businessName: formData.businessName,
          websiteUrl: formData.websiteUrl,
          businessDescription: formData.businessDescription,
          services: formData.services,
          faqs: validFAQs,
          tone: formData.tone,
          language: formData.language,
          welcomeMessage: formData.welcomeMessage,
          themeColor: formData.themeColor,
          position: formData.position,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.chatbot) {
        const apiKey = response.data.chatbot.apiKey;
        const backendUrl = getBackendUrl();
        const script = `<script src="${backendUrl}/widget.js" data-api-key="${apiKey}"></script>`;
        setGeneratedScript(script);
        setShowScriptModal(true);
        toastMessage("Chatbot created successfully!", "success");
      }
    } catch (err) {
      console.error("Error creating chatbot:", err);
      toastMessage(
        err.response?.data?.error || "Failed to create chatbot",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
          Create Your AI Chatbot
        </h1>
        <p className="text-[rgb(var(--color-text-secondary))]">
          Follow the steps below to build a customized chatbot for your business.
        </p>
      </div>

      {/* Progress Steps */}
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

      {/* Form Content */}
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
                required
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
                onChange={(e) =>
                  handleInputChange("businessDescription", e.target.value)
                }
                rows={6}
              />
            </div>
          )}

          {/* Step 3: Services */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                  Services & Products
                </h2>
                <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                  List the services or products you offer.
                </p>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="e.g., Web Development"
                  value={formData.currentService}
                  onChange={(e) => handleInputChange("currentService", e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addService()}
                />
                <Button onClick={addService} type="button">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.services.length > 0 && (
                <div className="space-y-2">
                  {formData.services.map((service, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))]"
                    >
                      <span className="text-[rgb(var(--color-text-primary))]">
                        {service}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(index)}
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: FAQs */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                    Add common questions and their answers.
                  </p>
                </div>
                <Button onClick={addFAQ} variant="outline" type="button">
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ
                </Button>
              </div>

              <div className="space-y-4">
                {formData.faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-secondary))]">
                          FAQ #{index + 1}
                        </span>
                        {formData.faqs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFAQ(index)}
                            type="button"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Question"
                        value={faq.question}
                        onChange={(e) =>
                          updateFAQ(index, "question", e.target.value)
                        }
                        className="mb-3"
                      />
                      <Textarea
                        placeholder="Answer"
                        value={faq.answer}
                        onChange={(e) =>
                          updateFAQ(index, "answer", e.target.value)
                        }
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Customize */}
          {currentStep === 5 && (
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

              <Select
                label="Language"
                options={[
                  { value: "en", label: "English" },
                  { value: "es", label: "Spanish" },
                  { value: "fr", label: "French" },
                  { value: "de", label: "German" },
                ]}
                value={formData.language}
                onChange={(e) => handleInputChange("language", e.target.value)}
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

              <Select
                label="Position"
                options={[
                  { value: "bottom-right", label: "Bottom Right" },
                  { value: "bottom-left", label: "Bottom Left" },
                ]}
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
              />
            </div>
          )}

          {/* Step 6: Generate */}
          {currentStep === 6 && (
            <div className="space-y-6 text-center">
              <div>
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--color-text-primary))]">
                  Ready to Generate!
                </h2>
                <p className="text-[rgb(var(--color-text-secondary))] mb-6">
                  Review your settings and generate your chatbot embed script.
                </p>
              </div>

              <div className="text-left space-y-2 p-4 rounded-lg bg-[rgb(var(--color-surface))]">
                <p className="font-semibold text-[rgb(var(--color-text-primary))]">
                  Chatbot Name: {formData.name || formData.businessName || "My Chatbot"}
                </p>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  Tone: {formData.tone} • Position: {formData.position}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Code className="w-5 h-5 mr-2" />
                    Generate Embed Script
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[rgb(var(--color-border))]">
            <Button
              onClick={prevStep}
              disabled={currentStep === 1}
              variant="outline"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={nextStep} variant="primary">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="primary"
              >
                {loading ? "Creating..." : "Create Chatbot"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Script Modal */}
      <Modal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        title="Your Embed Script"
        size="lg"
      >
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
                {generatedScript}
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

          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowScriptModal(false);
                router.push("/chatbots");
              }}
              variant="primary"
              className="flex-1"
            >
              Go to My Chatbots
            </Button>
            <Button
              onClick={() => {
                setShowScriptModal(false);
                setCurrentStep(1);
                setFormData({
                  name: "",
                  businessName: "",
                  websiteUrl: "",
                  businessDescription: "",
                  services: [],
                  currentService: "",
                  faqs: [{ question: "", answer: "" }],
                  tone: "friendly",
                  language: "en",
                  welcomeMessage: "Hello! How can I help you today?",
                  themeColor: "#8B5CF6",
                  position: "bottom-right",
                });
              }}
              variant="outline"
              className="flex-1"
            >
              Create Another
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

