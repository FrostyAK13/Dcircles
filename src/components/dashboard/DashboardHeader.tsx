"use client"

import { useState, useEffect } from "react";
import { Activity, Signal, MessageCircle, Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ConnectionStatus } from "@/app/lib/deriv-ws";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface DashboardHeaderProps {
  status: ConnectionStatus;
}

export function DashboardHeader({ status }: DashboardHeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const logo = PlaceHolderImages.find(img => img.id === 'app-logo');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const statusColors = {
    connected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    connecting: "bg-accent/10 text-accent border-accent/20",
    disconnected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    error: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {logo && (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border shadow-lg golden-glow">
            <Image 
              src={logo.imageUrl} 
              alt={logo.description} 
              fill 
              className="object-cover"
              data-ai-hint={logo.imageHint}
            />
          </div>
        )}
        {!logo && (
          <div className="p-2 rounded-xl bg-primary/20 golden-glow">
            <Activity className="w-6 h-6 text-primary" />
          </div>
        )}
        <a 
          href="https://frostydbot.site" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="transition-all hover:opacity-80 active:scale-95"
        >
          <h1 className="text-xl font-bold tracking-tight text-primary uppercase">FROSTYDBOT</h1>
        </a>
      </div>

      <div className="flex items-center gap-3">
        <a 
          href="https://wa.me/254115335502" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all hover:scale-105"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>

        {mounted && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-primary transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
            
            <Badge variant="outline" className={cn("px-3 py-1 flex items-center gap-2 font-medium capitalize", statusColors[status])}>
              <Signal className="w-3.5 h-3.5" />
              {status}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
