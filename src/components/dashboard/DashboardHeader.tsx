"use client"

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ConnectionStatus } from "@/app/lib/deriv-ws";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

interface DashboardHeaderProps { status: ConnectionStatus; }

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
    } else {
      // Default to dark for the jungle theme
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
    connected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    connecting: "bg-primary/10 text-primary border-primary/20",
    disconnected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    error: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="flex items-center gap-2 sm:gap-4">
        {logo && (
          <div className="relative w-7 h-7 sm:w-8 h-8 rounded-lg overflow-hidden border border-primary/20 icy-glow shrink-0">
            <Image 
              src={logo.imageUrl} 
              alt={logo.description} 
              fill 
              className="object-cover"
              data-ai-hint={logo.imageHint}
            />
          </div>
        )}
        <div className="flex flex-col">
          <a 
            href="https://indexnavigator.site" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-80 transition-opacity cursor-pointer no-underline"
          >
            <h1 className="text-sm sm:text-xl font-black tracking-tighter text-primary uppercase italic shiny-effect px-1 sm:px-2 py-0.5 rounded-lg whitespace-nowrap">
              INDEX NAVIGATOR
            </h1>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl w-8 h-8 sm:w-9 sm:h-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
            
            <Badge variant="outline" className={cn("px-2 sm:px-4 py-1 flex items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", statusColors[status])}>
              <div className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full animate-pulse", status === 'connected' ? "bg-emerald-500" : "bg-current")} />
              <span className="hidden xs:inline">{status}</span>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
