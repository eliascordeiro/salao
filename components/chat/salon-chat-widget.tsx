"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X, Send, Loader2, Store, User, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
 * Botão + painel de chat com o salão (cliente ↔ dono do salão).
 * Visual consistente com o assistente virtual (AIChatWidget).
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
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
      <Button variant="outline" size="sm" onClick={openChat} className="gap-2 w-full">
        <MessageCircle className="h-4 w-4" />
        Falar com o salão
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openChat} className="gap-2 w-full">
        <MessageCircle className="h-4 w-4" />
        Falar com o salão
      </Button>
      {mounted &&
        createPortal(
          <div className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col bg-background animate-fadeIn overflow-hidden sm:inset-auto sm:bottom-6 sm:right-6 sm:left-auto sm:top-auto sm:h-[600px] sm:max-h-[calc(100dvh-3rem)] sm:w-96 sm:max-w-[calc(100vw-3rem)] sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl">
      {/* Header */}
      <div className="shrink-0 p-4 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-white flex justify-between items-center sm:rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Store className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
            </span>
          </div>
          <div>
            <span className="font-semibold block">{salonName}</span>
            <span className="text-xs opacity-90">Chat direto com o salão</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="hover:bg-white/20 p-2 rounded-full transition-colors"
          aria-label="Fechar chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto overscroll-contain bg-background-alt/30 space-y-4">
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
              className={`flex gap-2 ${m.senderRole === "CLIENT" ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              {m.senderRole === "ADMIN" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 flex items-center justify-center">
                  <Store className="h-4 w-4 text-white" />
                </div>
              )}
              <div className="flex flex-col max-w-[75%]">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${
                    m.senderRole === "CLIENT"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-background border border-border rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                </div>
                <span
                  className={`text-[10px] text-muted-foreground mt-0.5 px-1 flex items-center gap-1 ${
                    m.senderRole === "CLIENT" ? "justify-end" : "justify-start"
                  }`}
                >
                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {m.senderRole === "CLIENT" && <CheckCheck className="h-3 w-3 text-primary" />}
                </span>
              </div>
              {m.senderRole === "CLIENT" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={sending || loading || !conversationId}
            className="flex-1 bg-background-alt/50"
          />
          <Button
            onClick={handleSend}
            disabled={sending || loading || !input.trim() || !conversationId}
            className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:opacity-90"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
          </div>,
          document.body
        )}
    </>
  );
}

