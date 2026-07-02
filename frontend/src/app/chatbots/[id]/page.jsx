"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { getBackendUrl, getAuthToken, isAuthenticated } from "@/lib/utils";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

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

export default function EditChatbotPage() {
  const router = useRouter();
  const params = useParams();
  const chatbotId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    isEnabled: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchChatbot();
  }, [router, chatbotId]);

  const fetchChatbot = async () => {
    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const response = await axios.get(`${url}/api/chatbots/${chatbotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.chatbot) {
        const chatbot = response.data.chatbot;
        setFormData({
          name: chatbot.name || "",
          businessName: chatbot.businessName || "",
          websiteUrl: chatbot.websiteUrl || "",
          businessDescription: chatbot.businessDescription || "",
          services: chatbot.services || [],
          currentService: "",
          faqs: chatbot.faqs && chatbot.faqs.length > 0 ? chatbot.faqs : [{ question: "", answer: "" }],
          tone: chatbot.tone || "friendly",
          language: chatbot.language || "en",
          welcomeMessage: chatbot.welcomeMessage || "Hello! How can I help you today?",
          themeColor: chatbot.themeColor || "#8B5CF6",
          position: chatbot.position || "bottom-right",
          isEnabled: chatbot.isEnabled !== undefined ? chatbot.isEnabled : true,
        });
      }
    } catch (err) {
      console.error("Error fetching chatbot:", err);
      toast("Failed to load chatbot", "error");
      router.push("/chatbots");
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = getAuthToken();
      const url = getBackendUrl();

      const validFAQs = formData.faqs.filter(
        (faq) => faq.question.trim() && faq.answer.trim()
      );

      await axios.put(
        `${url}/api/chatbots/${chatbotId}`,
        {
          name: formData.name,
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
          isEnabled: formData.isEnabled,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast("Chatbot updated successfully!", "success");
      router.push("/chatbots");
    } catch (err) {
      console.error("Error updating chatbot:", err);
      toast(err.response?.data?.error || "Failed to update chatbot", "error");
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/chatbots">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
            Edit Chatbot
          </h1>
          <p className="text-[rgb(var(--color-text-secondary))]">
            Update your chatbot configuration.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Chatbot Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />

            <Input
              label="Business Name"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
            />

            <Input
              label="Website URL"
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => handleInputChange("websiteUrl", e.target.value)}
            />

            <Textarea
              label="Business Description"
              value={formData.businessDescription}
              onChange={(e) => handleInputChange("businessDescription", e.target.value)}
              rows={6}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Services & Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="e.g., Web Development"
                value={formData.currentService}
                onChange={(e) => handleInputChange("currentService", e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>FAQs</CardTitle>
              <Button onClick={addFAQ} variant="outline" type="button" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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
                    onChange={(e) => updateFAQ(index, "question", e.target.value)}
                    className="mb-3"
                  />
                  <Textarea
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="flex items-center space-x-3 pt-4 border-t border-[rgb(var(--color-border))]">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.isEnabled}
                onChange={(e) => handleInputChange("isEnabled", e.target.checked)}
                className="w-4 h-4 rounded border-[rgb(var(--color-border))] text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="isEnabled" className="text-sm font-medium text-[rgb(var(--color-text-primary))]">
                Enable chatbot
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-4">
          <Link href="/chatbots">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

