"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const openConversation = async (id: string) => {
    setSelectedId(id);
    setLoadingMessages(true);
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
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="text-sm text-muted-foreground">
          Converse diretamente com seus clientes.
        </p>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4 h-[70vh]">
        {/* Lista de conversas */}
        <Card className="overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-sm text-muted-foreground p-6">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              Nenhuma conversa ainda.
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openConversation(c.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg mb-1 transition-colors",
                  selectedId === c.id ? "bg-primary/10" : "hover:bg-background-alt/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{c.client.name}</span>
                  {c.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {c.lastMessagePreview || "Sem mensagens"}
                </p>
              </button>
            ))
          )}
        </Card>

        {/* Thread */}
        <Card className="flex flex-col p-4">
          {!selectedId ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Selecione uma conversa para começar.
            </div>
          ) : (
            <>
              <div className="border-b pb-3 mb-3">
                <h3 className="font-semibold">{selectedConversation?.client.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation?.client.email}
                  {selectedConversation?.client.phone ? ` • ${selectedConversation.client.phone}` : ""}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                        m.senderRole === "ADMIN"
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

              <div className="flex items-center gap-2 pt-3 mt-3 border-t">
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
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={sending || !input.trim()} size="sm" className="h-10 w-10 p-0 shrink-0">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
