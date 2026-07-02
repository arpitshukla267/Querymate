"use client";

import Link from "next/link";
import { Check, Zap, Rocket, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      icon: Zap,
      price: "Free",
      period: "Forever",
      description: "Perfect for trying out QueryMate",
      features: [
        "Basic chatbot functionality",
        "Limited context data storage",
        "Community support",
        "Standard response time",
        "Up to 100 messages/month",
      ],
      cta: "Get Started",
      ctaLink: "/signup",
      popular: false,
    },
    {
      name: "Professional",
      icon: Rocket,
      price: "$9",
      period: "per month",
      description: "For growing businesses",
      features: [
        "Unlimited chatbot conversations",
        "Unlimited context data storage",
        "Priority support",
        "Faster response times",
        "Custom branding options",
        "Advanced analytics",
        "API access",
        "Unlimited messages",
      ],
      cta: "Start Free Trial",
      ctaLink: "/signup",
      popular: true,
    },
    {
      name: "Enterprise",
      icon: Crown,
      price: "Custom",
      period: "pricing",
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "Dedicated account manager",
        "24/7 priority support",
        "Custom integrations",
        "SLA guarantee",
        "On-premise deployment option",
        "Advanced security features",
        "Custom training & onboarding",
      ],
      cta: "Contact Sales",
      ctaLink: "/contact",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[rgb(var(--color-text-primary))] mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-[rgb(var(--color-text-secondary))] max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;

            return (
              <Card
                key={index}
                hover
                className={`relative overflow-hidden ${
                  isPopular ? "ring-2 ring-[rgb(var(--color-primary))] scale-105" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <div className={`p-8 ${isPopular ? "pt-12" : ""}`}>
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-[rgb(var(--color-primary))]/10">
                      <Icon className="w-8 h-8 text-[rgb(var(--color-primary))]" />
                    </div>
                    <h3 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-[rgb(var(--color-text-secondary))] text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-[rgb(var(--color-text-primary))]">
                        {plan.price}
                      </span>
                      {plan.period !== "Forever" && (
                        <span className="text-[rgb(var(--color-text-secondary))] ml-2">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-[rgb(var(--color-text-primary))]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={plan.ctaLink}>
                    <Button
                      variant={isPopular ? "primary" : "outline"}
                      className="w-full"
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-[rgb(var(--color-text-primary))] mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                question: "Can I change plans later?",
                answer:
                  "Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
              },
              {
                question: "What payment methods do you accept?",
                answer:
                  "We accept all major credit cards, debit cards, and PayPal. Enterprise plans can be invoiced.",
              },
              {
                question: "Is there a free trial?",
                answer:
                  "Yes! The Professional plan comes with a 14-day free trial. No credit card required.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll refund your payment.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <div className="p-6">
                  <h3 className="font-semibold text-[rgb(var(--color-text-primary))] mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-[rgb(var(--color-text-secondary))]">{faq.answer}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-[rgb(var(--color-text-secondary))] mb-4">
            Still have questions? We're here to help.
          </p>
          <Link href="/docs">
            <Button variant="primary" size="lg">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
