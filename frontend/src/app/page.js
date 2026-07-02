"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Bot, Sparkles, Zap, Shield, ArrowRight, CheckCircle, MessageSquare } from "lucide-react";
import { isAuthenticated } from "@/lib/utils";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-900/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-800/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-500/50 border border-purple-500/30">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
            QueryMate
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="text-white/90 hover:text-white hover:bg-white/10 border border-white/20"
            >
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              variant="primary" 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/50 border border-purple-500/30"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-purple-900/50 border border-purple-700/50 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-200">Powered by Advanced AI</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
              Build AI Chatbots
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-purple-200 bg-clip-text text-transparent">
              That Actually Work
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-purple-200/90 max-w-3xl mx-auto leading-relaxed">
            Create powerful, customizable AI chatbots for your business in minutes. 
            <span className="text-white font-medium"> No coding required. Deploy anywhere.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center space-x-4 pt-4 flex-wrap gap-4">
            <Link href="/try-chat">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 text-lg shadow-xl shadow-purple-500/50 border border-purple-500/30 hover:scale-105 transition-transform"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Try AI Chat (Free)
              </Button>
            </Link>
            <Link href="/try-builder">
              <Button 
                size="lg" 
                variant="outline" 
                className="px-8 py-4 text-lg border-2 border-purple-500/50 text-white hover:bg-purple-900/30 hover:border-purple-400/70 backdrop-blur-sm hover:scale-105 transition-transform"
              >
                <Bot className="w-5 h-5 mr-2" />
                Try Builder (Free)
              </Button>
            </Link>
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 text-lg border border-white/20 hover:scale-105 transition-transform backdrop-blur-sm"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Sign Up
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-8 pt-8 text-sm text-purple-300/80">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span>Setup in 5 Minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              <span>Free Forever Plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-purple-900/60 to-purple-950/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-700/50 hover:border-purple-600/70 transition-all duration-300 hover:scale-105 shadow-xl shadow-purple-900/50">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50 border border-purple-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">AI-Powered</h3>
              <p className="text-purple-200/90 leading-relaxed">
                Powered by advanced AI models to provide intelligent, context-aware responses.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-purple-900/60 to-purple-950/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-700/50 hover:border-purple-600/70 transition-all duration-300 hover:scale-105 shadow-xl shadow-purple-900/50">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50 border border-purple-500/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Lightning Fast</h3>
              <p className="text-purple-200/90 leading-relaxed">
                Deploy in minutes with our simple setup process. No technical knowledge needed.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-purple-900/60 to-purple-950/80 backdrop-blur-xl rounded-2xl p-8 border border-purple-700/50 hover:border-purple-600/70 transition-all duration-300 hover:scale-105 shadow-xl shadow-purple-900/50">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50 border border-purple-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Secure & Private</h3>
              <p className="text-purple-200/90 leading-relaxed">
                Your data is encrypted and secure. We never share your information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Everything You Need to Build
          </h2>
          <p className="text-xl text-purple-200/80 mb-12">
            All the tools and features you need to create professional AI chatbots
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Custom Branding", desc: "Match your brand colors and style" },
              { title: "Multiple Languages", desc: "Support for 20+ languages" },
              { title: "Analytics Dashboard", desc: "Track conversations and insights" },
              { title: "API Integration", desc: "Integrate with your existing tools" },
              { title: "24/7 Availability", desc: "Chatbots work around the clock" },
              { title: "Custom Training", desc: "Train on your own data and content" },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-purple-900/40 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30 hover:border-purple-600/50 transition-all duration-300 hover:scale-105"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-200/70 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-900/60 to-purple-950/80 backdrop-blur-xl rounded-3xl p-12 border border-purple-700/50 shadow-2xl shadow-purple-900/50">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-purple-200/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using QueryMate to build powerful AI chatbots. 
            Start your free account today.
          </p>
          <Link href="/signup">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-10 py-6 text-lg shadow-xl shadow-purple-500/50 border border-purple-500/30 hover:scale-105 transition-transform"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-purple-800/30 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">QueryMate</span>
          </div>
          <div className="flex items-center space-x-6 text-purple-300/80 text-sm">
            <Link href="/docs" className="hover:text-white transition-colors">
              Documentation
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
        <div className="mt-8 text-center text-purple-400/60 text-sm">
          © 2024 QueryMate. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
