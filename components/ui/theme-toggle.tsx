"use client";

import { Moon, Sun, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Theme = "light" | "twilight" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Detectar tema atual no mount
    const root = document.documentElement;
    if (root.classList.contains('light')) {
      setTheme('light');
    } else if (root.classList.contains('twilight')) {
      setTheme('twilight');
    } else {
      setTheme('dark');
    }
  }, []);

  const cycleTheme = () => {
    const root = document.documentElement;
    let nextTheme: Theme;

    // Ciclo: light → twilight → dark → light
    if (theme === 'light') {
      nextTheme = 'twilight';
    } else if (theme === 'twilight') {
      nextTheme = 'dark';
    } else {
      nextTheme = 'light';
    }

    // Remover todos os temas e aplicar o novo
    root.classList.remove('light', 'twilight', 'dark');
    root.classList.add(nextTheme);
    localStorage.setItem('display-mode', nextTheme);
    setTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4 text-primary" />;
      case 'twilight':
        return <Sunset className="h-4 w-4 text-primary" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-primary" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Claro';
      case 'twilight':
        return 'Twilight';
      case 'dark':
        return 'Escuro';
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case 'light':
        return 'Mudar para tema Twilight';
      case 'twilight':
        return 'Mudar para tema escuro';
      case 'dark':
        return 'Mudar para tema claro';
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="gap-2 border border-border/50 hover:bg-background-alt/80"
      title={getThemeTitle()}
    >
      {getThemeIcon()}
      <span className="hidden md:inline text-foreground">{getThemeLabel()}</span>
    </Button>
  );
}
