"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Microscope, Atom, Lightbulb, GraduationCap, Telescope, Bot, Sparkles } from "lucide-react";

const QUOTES = [
  { text: "Research is what I'm doing when I don't know what I'm doing.", author: "Wernher von Braun", icon: Microscope },
  { text: "If we knew what it was we were doing, it would not be called research, would it?", author: "Albert Einstein", icon: Atom },
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan", icon: Telescope },
  { text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson", icon: Lightbulb },
  { text: "Science is a way of thinking much more than it is a body of knowledge.", author: "Carl Sagan", icon: BookOpen },
  { text: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more.", author: "Marie Curie", icon: GraduationCap },
];

const LUMI_MESSAGES = [
  "Lumi is preparing your workspace...",
  "Lumi is gathering your data...",
  "Lumi is organizing your tasks...",
  "Lumi is syncing your meetings...",
  "Lumi is analyzing your lab activity...",
  "Lumi is loading your dashboard...",
];

export function LoadingState({ layout = "dashboard" }: { layout?: "dashboard" | "page" | "cards" | "list" | "table" }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [lumiMessageIndex, setLumiMessageIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
    setLumiMessageIndex(Math.floor(Math.random() * LUMI_MESSAGES.length));

    // Cycle through Lumi messages
    const interval = setInterval(() => {
      setLumiMessageIndex((prev) => (prev + 1) % LUMI_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const Quote = QUOTES[quoteIndex];
  const Icon = Quote.icon;

  const renderSkeleton = () => {
    switch(layout) {
      case "cards":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
              </div>
            ))}
          </div>
        );
      case "list":
      case "table":
        return (
          <div className="space-y-4 w-full">
            <div className="relative overflow-hidden rounded-lg">
              <Skeleton className="h-12 w-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-lg" style={{ animationDelay: `${i * 100}ms` }}>
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
              </div>
            ))}
          </div>
        );
      case "dashboard":
      default:
        return (
          <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
              <div className="relative overflow-hidden rounded-lg">
                <Skeleton className="h-10 w-48" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
              </div>
              <div className="relative overflow-hidden rounded-lg">
                <Skeleton className="h-10 w-24" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl" style={{ animationDelay: `${i * 100}ms` }}>
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" style={{ animationDelay: `${i * 150}ms` }} />
                </div>
              ))}
            </div>
            <div className="relative overflow-hidden rounded-xl">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skeleton-shimmer" />
            </div>
          </div>
        );
    }
  }

  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center relative p-8">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-primary/5 animate-pulse duration-[4000ms] -z-10" />

      {/* Skeletons fading in the background */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none flex items-center justify-center p-8">
        {renderSkeleton()}
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center max-w-lg text-center animate-in fade-in duration-700 zoom-in-95">
        {/* Lumi AI Avatar */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/20 via-primary/20 to-indigo-600/20 rounded-full blur-xl animate-pulse duration-[3000ms]" />
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-500/30">
            <Bot className="h-12 w-12 text-white" />
            <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
          {/* Orbiting particles */}
          <div className="absolute inset-0 animate-spin duration-[8000ms]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 h-2 w-2 rounded-full bg-violet-500" />
          </div>
          <div className="absolute inset-0 animate-spin duration-[6000ms]" style={{ animationDirection: 'reverse' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 h-1.5 w-1.5 rounded-full bg-primary" />
          </div>
        </div>

        {/* Lumi Message */}
        <div className="mb-8 h-8">
          <p className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-primary bg-clip-text text-transparent animate-in fade-in duration-500" key={lumiMessageIndex}>
            {LUMI_MESSAGES[lumiMessageIndex]}
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden mb-10">
          <div className="h-full bg-gradient-to-r from-violet-600 via-primary to-indigo-600 rounded-full animate-loading-bar" />
        </div>

        {/* Quote Section */}
        <div className="border-t border-border/50 pt-8 mt-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-base md:text-lg font-medium text-muted-foreground mb-3 leading-relaxed italic">
            &quot;{Quote.text}&quot;
          </h3>
          <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
            — {Quote.author}
          </p>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 70%; margin-left: 15%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
