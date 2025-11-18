"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 border border-border/50 hover:bg-background-alt/80"
      title={resolvedTheme === "dark" ? "Mudar para tema claro" : "Mudar para tema escuro"}
    >
      {resolvedTheme === "dark" ? (
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
