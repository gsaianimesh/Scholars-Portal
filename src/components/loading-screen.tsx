"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Microscope, Atom, Lightbulb, GraduationCap, Telescope } from "lucide-react";

const QUOTES = [
  { text: "Research is what I'm doing when I don't know what I'm doing.", author: "Wernher von Braun", icon: Microscope },
  { text: "If we knew what it was we were doing, it would not be called research, would it?", author: "Albert Einstein", icon: Atom },
  { text: "Somewhere, something incredible is waiting to be known.", author: "Carl Sagan", icon: Telescope },
  { text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson", icon: Lightbulb },
  { text: "Science is a way of thinking much more than it is a body of knowledge.", author: "Carl Sagan", icon: BookOpen },
  { text: "Nothing in life is to be feared, it is only to be understood. Now is the time to understand more.", author: "Marie Curie", icon: GraduationCap },
];

export function LoadingState({ layout = "dashboard" }: { layout?: "dashboard" | "page" | "cards" | "list" | "table" }) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
  }, []);

  const Quote = QUOTES[quoteIndex];
  const Icon = Quote.icon;

  const renderSkeleton = () => {
    switch(layout) {
      case "cards":
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
          </div>
        );
      case "list":
      case "table":  
        return (
          <div className="space-y-4 w-full">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        );
      case "dashboard":
      default:
        return (
          <div className="space-y-6 w-full">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        );
    }
  }

  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center relative p-8">
      {/* Skeletons fading in the background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center p-8 blur-[1px]">
        {renderSkeleton()}
      </div>

      {/* Centered Quote and Illustration */}
      <div className="relative z-10 flex flex-col items-center max-w-lg text-center animate-in fade-in duration-1000 zoom-in-95">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-xl shadow-primary/5 animate-pulse duration-[2000ms]">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4 leading-relaxed">
          &quot;{Quote.text}&quot;
        </h3>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          — {Quote.author}
        </p>
        
        <div className="mt-12 flex items-center gap-2 text-primary">
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  );
}
