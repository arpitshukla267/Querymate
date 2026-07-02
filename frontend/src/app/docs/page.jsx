"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  BookOpen,
  Code,
  HelpCircle,
  MessageSquare,
  Bot,
  Settings,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function DocsPage() {
  const faqs = [
    {
      question: "How do I create a chatbot?",
      answer:
        "Navigate to the Personalize Chatbot page. Our AI will ask you questions about your business to gather information and create your personalized chatbot.",
    },
    {
      question: "How do I embed my chatbot on my website?",
      answer:
        "After creating a chatbot, go to My Chatbots, click on the 'Script' button, and copy the embed script. Paste it before the closing </body> tag on your website.",
    },
    {
      question: "What's the difference between Chatbot Builder and AI Support Chat?",
      answer:
        "Personalize Chatbot creates custom chatbots that only answer questions based on your business information. AI Support Chat is a general AI assistant that can answer any question.",
    },
    {
      question: "Can I customize my chatbot's appearance?",
      answer:
        "Yes! You can customize the theme color, position (bottom-left or bottom-right), welcome message, tone, and language when creating or editing a chatbot.",
    },
    {
      question: "How do I enable or disable a chatbot?",
      answer:
        "Go to My Chatbots, find the chatbot you want to manage, and click the Enable/Disable button. You can also edit the chatbot and toggle the 'Enable chatbot' option.",
    },
    {
      question: "What happens if I delete a chatbot?",
      answer:
        "Deleting a chatbot permanently removes it and all associated conversations. This action cannot be undone. Make sure to backup any important data before deleting.",
    },
  ];

  const gettingStartedSteps = [
    {
      step: 1,
      title: "Sign Up",
      description: "Create your account to get started",
      icon: CheckCircle,
    },
    {
      step: 2,
      title: "Build Your Chatbot",
            description: "Use the Personalize Chatbot wizard to create your first chatbot",
      icon: Bot,
    },
    {
      step: 3,
      title: "Customize",
      description: "Set your business info, tone, and appearance",
      icon: Settings,
    },
    {
      step: 4,
      title: "Embed",
      description: "Copy your embed script and add it to your website",
      icon: Code,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
          Help & Documentation
        </h1>
        <p className="text-[rgb(var(--color-text-secondary))]">
          Everything you need to know about using QueryMate.
        </p>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <CardTitle>Getting Started</CardTitle>
          </div>
          <CardDescription>Follow these steps to get up and running</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gettingStartedSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[rgb(var(--color-primary))] text-white flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <Icon className="w-5 h-5 text-[rgb(var(--color-primary))]" />
                  </div>
                  <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card hover>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              <CardTitle>Personalize Chatbot</CardTitle>
            </div>
            <CardDescription>Create and customize your chatbots</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/personalize-chatbot">
              <Button variant="outline" className="w-full">
                Go to Builder
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              <CardTitle>AI Support Chat</CardTitle>
            </div>
            <CardDescription>Get help from our AI assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chat">
              <Button variant="outline" className="w-full">
                Start Chatting
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card hover>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              <CardTitle>Integration Guide</CardTitle>
            </div>
            <CardDescription>Learn how to embed your chatbot</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/chatbots">
              <Button variant="outline" className="w-full">
                View Guide
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <CardTitle>Integration Guide</CardTitle>
          </div>
          <CardDescription>Step-by-step instructions for embedding your chatbot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                Step 1: Create Your Chatbot
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                Use the Personalize Chatbot page to create a new chatbot. Our AI will ask you questions about your business.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                Step 2: Get Your Embed Script
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                After creating your chatbot, go to "My Chatbots" and click the "Script" button
                on your chatbot card.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                Step 3: Add to Your Website
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                Copy the embed script and paste it before the closing{" "}
                <code className="bg-[rgb(var(--color-surface))] px-2 py-1 rounded text-xs">
                  &lt;/body&gt;
                </code>{" "}
                tag in your HTML.
              </p>
              <div className="bg-[rgb(var(--color-surface))] p-4 rounded-lg border border-[rgb(var(--color-border))]">
                <code className="text-sm text-[rgb(var(--color-text-primary))]">
                  {`<script src="YOUR_BACKEND_URL/widget.js" data-api-key="YOUR_API_KEY"></script>`}
                </code>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-[rgb(var(--color-text-primary))]">
                Step 4: Test Your Chatbot
              </h3>
              <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                Visit your website and look for the chatbot widget in the bottom corner. Click it
                to start chatting!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <CardTitle>Troubleshooting</CardTitle>
          </div>
          <CardDescription>Common issues and solutions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-[rgb(var(--color-text-primary))] mb-1">
                Chatbot not appearing on my website
              </h4>
              <ul className="list-disc list-inside text-sm text-[rgb(var(--color-text-secondary))] space-y-1 ml-4">
                <li>Make sure the script is placed before the closing &lt;/body&gt; tag</li>
                <li>Check that your API key is correct</li>
                <li>Verify that the chatbot is enabled in My Chatbots</li>
                <li>Clear your browser cache and reload the page</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[rgb(var(--color-text-primary))] mb-1">
                Chatbot not responding
              </h4>
              <ul className="list-disc list-inside text-sm text-[rgb(var(--color-text-secondary))] space-y-1 ml-4">
                <li>Check your internet connection</li>
                <li>Verify that the backend server is running</li>
                <li>Make sure your API key is valid</li>
                <li>Check browser console for error messages</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[rgb(var(--color-text-primary))] mb-1">
                Customization not working
              </h4>
              <ul className="list-disc list-inside text-sm text-[rgb(var(--color-text-secondary))] space-y-1 ml-4">
                <li>Save your chatbot settings after making changes</li>
                <li>Wait a few minutes for changes to propagate</li>
                <li>Clear your browser cache</li>
                <li>Make sure the chatbot is enabled</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-[rgb(var(--color-primary))]" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>Answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]"
              >
                <h3 className="font-semibold text-[rgb(var(--color-text-primary))] mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>We're here to assist you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <Link href="/chat" className="flex-1">
              <Button variant="primary" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat with AI Support
              </Button>
            </Link>
            <Link href="/settings" className="flex-1">
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

