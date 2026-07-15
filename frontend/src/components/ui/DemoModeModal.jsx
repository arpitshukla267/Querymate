"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, AlertTriangle, Monitor, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

/**
 * Check if an error is related to AI/LLM service failure.
 * Use this helper in catch blocks to decide whether to show the DemoModeModal.
 */
export function isAiServiceError(error) {
  // Check for explicit backend isAiError flag
  if (error?.response?.data?.isAiError === true) {
    return true;
  }

  const message = (
    error?.response?.data?.error ||
    error?.message ||
    (typeof error === "string" ? error : "")
  ).toLowerCase();

  const aiErrorPatterns = [
    "ai service error",
    "ai service unavailable",
    "deepseek",
    "ollama",
    "missing deepseek_api_key",
    "llm",
    "api timeout",
    "econnrefused",
    "fetch failed",
    "failed to fetch",
    "network error",
    "streaming failed",
  ];

  // Check if the error matches any AI-related pattern
  if (aiErrorPatterns.some((pattern) => message.includes(pattern))) {
    return true;
  }

  // Also check for 500 errors from chat-related endpoints
  const status = error?.response?.status || error?.status;
  const url = error?.config?.url || error?.response?.config?.url || "";
  if (status === 500 && (url.includes("/api/chat") || url.includes("/api/chat/public"))) {
    return true;
  }

  return false;
}

/**
 * DemoModeModal - Shows when LLM API is unavailable.
 * Explains the project context and offers a demo video.
 */
export function DemoModeModal({ isOpen, onClose, demoVideoUrl = "" }) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  // Reset video state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowVideo(false);
      setVideoLoaded(false);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Preload video when modal opens
  useEffect(() => {
    if (isOpen && demoVideoUrl && videoRef.current) {
      videoRef.current.load();
    }
  }, [isOpen, demoVideoUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl overflow-hidden",
          "border border-purple-500/30",
          "shadow-2xl shadow-purple-900/40",
          "animate-fade-in"
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          background:
            "linear-gradient(135deg, rgba(30, 15, 60, 0.97) 0%, rgba(20, 10, 40, 0.99) 100%)",
        }}
      >
        {/* Decorative gradient border glow */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute -top-1 -left-1 -right-1 h-1 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent rounded-t-2xl" />
        </div>

        {/* Header with icon */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 z-10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon + Title */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 pr-8">
              <h2 className="text-xl font-bold text-white mb-1">
                Demo Mode Available
              </h2>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  AI Offline
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          <p className="text-purple-100/90 text-sm leading-relaxed mb-4">
            Thanks for trying the AI features!
          </p>
          <p className="text-purple-200/70 text-sm leading-relaxed mb-4">
            This project was built primarily for learning and showcasing AI
            engineering concepts. Due to limited funding, we don&apos;t
            currently have a publicly hosted LLM API.
          </p>
          <p className="text-purple-200/70 text-sm leading-relaxed mb-4">
            During development, the application runs on a local{" "}
            <span className="text-purple-300 font-medium">
              Ollama-powered LLM
            </span>
            , which isn&apos;t available in the public deployment. If
            you&apos;re seeing this message, it means the AI service
            couldn&apos;t be reached.
          </p>
          <p className="text-purple-200/70 text-sm leading-relaxed">
            You can still explore how the feature works by watching the demo
            below.
          </p>
        </div>

        {/* Video Section */}
        <div className="px-6 py-4">
          {!showVideo ? (
            <button
              onClick={() => setShowVideo(true)}
              className="group w-full relative overflow-hidden rounded-xl border border-purple-500/30 bg-purple-950/50 hover:bg-purple-900/50 transition-all duration-300 p-6"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/40 group-hover:shadow-purple-500/60 group-hover:scale-110 transition-all duration-300">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">
                    ▶ Watch Demo
                  </p>
                  <p className="text-purple-300/70 text-xs">
                    See the AI features in action
                  </p>
                </div>
              </div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </button>
          ) : (
            <div className="rounded-xl overflow-hidden border border-purple-500/30 bg-black">
              {demoVideoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    controls
                    autoPlay
                    className="w-full aspect-video"
                    onLoadedData={() => setVideoLoaded(true)}
                  >
                    <source src={demoVideoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  {!videoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-purple-300 text-sm">Loading demo...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-purple-950/50">
                  <div className="text-center space-y-3 p-6">
                    <Monitor className="w-12 h-12 text-purple-400/50 mx-auto" />
                    <p className="text-purple-300/70 text-sm">
                      Demo video coming soon!
                    </p>
                    <p className="text-purple-400/50 text-xs">
                      Check back later for a full walkthrough.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2">
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full border border-purple-500/30 text-purple-200 hover:bg-purple-900/40 hover:text-white transition-all duration-200"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
