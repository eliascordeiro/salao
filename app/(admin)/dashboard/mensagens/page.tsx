"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, Send, Search, Phone, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "@/components/chat/typing-indicator";

interface ConversationSummary {
  id: string;
  client: { id: string; name: string; email: string; phone: string | null; image: string | null };
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderRole: "CLIENT" | "ADMIN";
  content: string;
  createdAt: string;
}

export default function MensagensPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<string | null>(null);
  const lastTypingPingRef = useRef(0);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  // Polling de mensagens novas na conversa aberta (a cada 5s)
  const loadMessages = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    if (!selectedId) return;
    const interval = setInterval(() => {
      if (selectedIdRef.current) loadMessages(selectedIdRef.current, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedId, loadMessages]);

  // Polling do indicador "digitando..." da outra pessoa (a cada 2s)
  useEffect(() => {
    if (!selectedId) {
      setOtherTyping(false);
      return;
    }
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/conversations/${selectedId}/typing`);
        if (res.ok) {
          const data = await res.json();
          setOtherTyping(!!data.typing);
        }
      } catch {
        // silencioso
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const openConversation = async (id: string) => {
    setSelectedId(id);
    setOtherTyping(false);
    await loadMessages(id);
  };

  const handleTyping = () => {
    if (!selectedId) return;
    const now = Date.now();
    if (now - lastTypingPingRef.current < 2000) return;
    lastTypingPingRef.current = now;
    fetch(`/api/chat/conversations/${selectedId}/typing`, { method: "POST" }).catch(() => {});
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  const handleSend = async () => {
    if (!selectedId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${selectedId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        loadConversations();
      }
    } finally {
      setSending(false);
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  function getInitials(name: string) {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatConvTime(iso: string | null) {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  const avatarColors = [
    "bg-violet-500", "bg-blue-500", "bg-emerald-500",
    "bg-rose-500", "bg-amber-500", "bg-cyan-500",
  ];
  function avatarColor(name: string) {
    const idx = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[idx];
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Page header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="text-sm text-muted-foreground">Converse diretamente com seus clientes.</p>
      </div>

      <div className="flex-1 grid md:grid-cols-[320px_1fr] gap-0 rounded-xl border border-border overflow-hidden min-h-0">
        {/* ── Sidebar ── */}
        <div className="flex flex-col border-r border-border bg-card min-h-0">
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <p className="font-semibold text-sm">Conversas</p>
            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                className="w-full rounded-lg bg-background-alt/60 border border-border pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                placeholder="Buscar conversa..."
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-sm text-muted-foreground p-6 gap-2">
                <MessageCircle className="h-9 w-9 opacity-30" />
                <span>Nenhuma conversa ainda.</span>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3",
                      selectedId === c.id
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-background-alt/60 border border-transparent"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", avatarColor(c.client.name))}>
                      {getInitials(c.client.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-sm truncate", c.unreadCount > 0 ? "font-semibold" : "font-medium")}>
                          {c.client.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatConvTime(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className={cn("text-xs truncate", c.unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
                          {c.lastMessagePreview || "Sem mensagens"}
                        </p>
                        {c.unreadCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4.5 min-w-[18px] flex items-center justify-center px-1 flex-shrink-0">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className="flex flex-col bg-card min-h-0">
          {!selectedId ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-background-alt flex items-center justify-center">
                <MessageCircle className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">Selecione uma conversa</p>
              <p className="text-xs opacity-60">Escolha um cliente na lista ao lado.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0 bg-card/80 backdrop-blur-sm">
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0", avatarColor(selectedConversation?.client.name ?? ""))}>
                  {getInitials(selectedConversation?.client.name ?? "?")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight truncate">{selectedConversation?.client.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedConversation?.client.phone ?? selectedConversation?.client.email}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {selectedConversation?.client.phone && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                      <a href={`tel:${selectedConversation.client.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    Nenhuma mensagem ainda. Diga olá!
                  </div>
                ) : (
                  <>
                    {messages.map((m, i) => {
                      const isAdmin = m.senderRole === "ADMIN";
                      const prevSame = i > 0 && messages[i - 1].senderRole === m.senderRole;
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col",
                            isAdmin ? "items-end" : "items-start",
                            prevSame ? "mt-0.5" : "mt-3"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[72%] px-3.5 py-2 text-sm leading-relaxed shadow-sm",
                              isAdmin
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                                : "bg-background-alt text-foreground rounded-2xl rounded-bl-sm"
                            )}
                          >
                            {m.content}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-0.5 px-1 flex items-center gap-0.5">
                            {formatTime(m.createdAt)}
                            {isAdmin && <span className="text-primary/60">✓✓</span>}
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
                {otherTyping && (
                  <div className="mt-3">
                    <TypingIndicator />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-card flex-shrink-0">
                <Input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Digite uma mensagem..."
                  disabled={sending}
                  className="flex-1 rounded-full bg-background-alt/60 border-border/60 focus-visible:ring-primary/30"
                />
                <Button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  size="icon"
                  className="h-9 w-9 rounded-full flex-shrink-0"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
