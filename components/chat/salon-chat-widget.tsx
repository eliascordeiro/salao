"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "CLIENT" | "ADMIN";
  content: string;
  createdAt: string;
}

interface SalonChatWidgetProps {
  salonId: string;
  salonName: string;
}

/**
 * Botão + painel flutuante de chat com o salão (cliente ↔ dono do salão).
 * Cria/abre a conversa sob demanda ao clicar em "Falar com o salão".
 */
export function SalonChatWidget({ salonId, salonName }: SalonChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling de respostas do salão (a cada 5s quando o chat está aberto)
  useEffect(() => {
    conversationIdRef.current = conversationId;
    if (!conversationId || !open) return;
    const interval = setInterval(async () => {
      const id = conversationIdRef.current;
      if (!id) return;
      try {
        const res = await fetch(`/api/chat/conversations/${id}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch {
        // silencioso
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [conversationId, open]);

  const openChat = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const convRes = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId }),
      });
      if (!convRes.ok) {
        const errData = await convRes.json().catch(() => ({}));
        setError(errData.error || `Erro ${convRes.status} ao iniciar conversa`);
        return;
      }
      const conv = await convRes.json();
      setConversationId(conv.id);

      const msgsRes = await fetch(`/api/chat/conversations/${conv.id}/messages`);
      if (msgsRes.ok) {
        setMessages(await msgsRes.json());
      }
    } catch (e) {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!conversationId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
      }
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={openChat} className="gap-2">
        <MessageCircle className="h-4 w-4" />
        Falar com o salão
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex h-[100dvh] flex-col bg-background",
        // Desktop/tablet: vira um painel flutuante no canto inferior direito
        "sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto",
        "sm:h-[70dvh] sm:max-w-sm sm:rounded-2xl sm:border sm:border-border/50 sm:shadow-2xl"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 sm:rounded-t-2xl">
        <div>
          <p className="font-semibold text-sm">{salonName}</p>
          <p className="text-xs text-muted-foreground">Chat direto com o salão</p>
        </div>
        <button onClick={() => setOpen(false)} className="p-2 -m-2 text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto overscroll-contain p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={openChat}>
              Tentar novamente
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground mt-8">
            Envie uma mensagem para {salonName}.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex flex-col",
                m.senderRole === "CLIENT" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                  m.senderRole === "CLIENT"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background-alt"
                )}
              >
                {m.content}
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-center gap-1">
                {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                {m.senderRole === "CLIENT" && <CheckCheck className="h-3 w-3 text-primary" />}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Digite sua mensagem..."
          disabled={sending || loading || !conversationId}
        />
        <Button
          onClick={handleSend}
          disabled={sending || loading || !input.trim()}
          size="sm"
          className="h-10 w-10 shrink-0 p-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
