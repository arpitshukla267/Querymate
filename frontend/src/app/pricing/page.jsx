"use client";

import React from "react";
import Link from "next/link";
import { Check, Zap, Rocket, Crown } from "lucide-react";

function PricingPage() {
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
        "Up to 100 messages/month"
      ],
      cta: "Get Started",
      ctaLink: "/signup",
      popular: false,
      color: "indigo"
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
        "Unlimited messages"
      ],
      cta: "Start Free Trial",
      ctaLink: "/signup",
      popular: true,
      color: "purple"
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
        "Custom training & onboarding"
      ],
      cta: "Contact Sales",
      ctaLink: "/contact",
      popular: false,
      color: "yellow"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            
            return (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  isPopular ? "ring-2 ring-purple-500 scale-105" : ""
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
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      plan.color === "indigo" ? "bg-indigo-100" :
                      plan.color === "purple" ? "bg-purple-100" :
                      "bg-yellow-100"
                    }`}>
                      <Icon className={`w-8 h-8 ${
                        plan.color === "indigo" ? "text-indigo-600" :
                        plan.color === "purple" ? "text-purple-600" :
                        "text-yellow-600"
                      }`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.period !== "Forever" && (
                        <span className="text-gray-600 ml-2">
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
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link
                    href={plan.ctaLink}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition ${
                      isPopular
                        ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                        : plan.color === "yellow"
                        ? "bg-yellow-400 text-indigo-900 hover:bg-yellow-500"
                        : plan.color === "indigo"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and PayPal. Enterprise plans can be invoiced.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! The Professional plan comes with a 14-day free trial. No credit card required.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, we'll refund your payment.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Still have questions? We're here to help.
          </p>
          <Link
            href="/contact"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;

