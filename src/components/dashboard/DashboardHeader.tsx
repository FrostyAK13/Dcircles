"use client"

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
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
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const statusColors = {
    connected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    connecting: "bg-primary/10 text-primary border-primary/20",
    disconnected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    error: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-4">
        {logo && (
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-primary/20 icy-glow">
            <Image 
              src={logo.imageUrl} 
              alt={logo.description} 
              fill 
              className="object-cover"
              data-ai-hint={logo.imageHint}
            />
          </div>
        )}
        <a 
          href="https://frostydbot.site" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="transition-all hover:opacity-90 active:scale-95"
        >
          <h1 className="text-xl font-black tracking-tighter text-[hsl(var(--brand-blue))] uppercase italic shiny-effect px-2 py-0.5 rounded-lg">
            FROSTYDBOT
          </h1>
        </a>
      </div>

      <div className="flex items-center gap-4">
        {mounted && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl w-9 h-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
            
            <Badge variant="outline" className={cn("px-4 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", statusColors[status])}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", status === 'connected' ? "bg-emerald-500" : "bg-current")} />
              {status}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
