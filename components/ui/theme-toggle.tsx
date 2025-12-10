"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('display-mode', 'light');
      setIsDark(false);
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('display-mode', 'dark');
      setIsDark(true);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 border border-border/50 hover:bg-background-alt/80"
      title={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 text-primary" />
          <span className="hidden md:inline text-foreground">Claro</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-primary" />
          <span className="hidden md:inline text-foreground">Escuro</span>
        </>
      )}
    </Button>
  );
}
