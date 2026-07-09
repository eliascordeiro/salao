"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
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
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const convRes = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId }),
      });
      if (!convRes.ok) return;
      const conv = await convRes.json();
      setConversationId(conv.id);

      const msgsRes = await fetch(`/api/chat/conversations/${conv.id}/messages`);
      if (msgsRes.ok) {
        setMessages(await msgsRes.json());
      }
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
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex h-[70vh] max-w-sm flex-col rounded-2xl border border-border/50 bg-background shadow-2xl sm:right-6 sm:left-auto sm:bottom-6">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div>
          <p className="font-semibold text-sm">{salonName}</p>
          <p className="text-xs text-muted-foreground">Chat direto com o salão</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                m.senderRole === "CLIENT"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-background-alt"
              )}
            >
              {m.content}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-border/50 p-3">
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
          disabled={sending || loading}
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
