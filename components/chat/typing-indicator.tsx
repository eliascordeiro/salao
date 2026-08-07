import { cn } from "@/lib/utils";

/**
 * Bolha "digitando..." com três pontos animados, no estilo WhatsApp.
 */
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-2xl rounded-bl-sm bg-background-alt px-4 py-3 w-fit", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
    </div>
  );
}
