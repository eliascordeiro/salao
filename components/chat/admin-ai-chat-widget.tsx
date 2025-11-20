"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AdminAIChatWidgetProps {
  userName?: string;
  userRole?: string;
}

export function AdminAIChatWidget({ 
  userName = "Administrador",
  userRole = "OWNER"
}: AdminAIChatWidgetProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Olá ${userName}! 👋 Sou seu assistente virtual do sistema. Estou aqui para ajudar você a usar todas as funcionalidades da plataforma. Como posso ajudar?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detecta mudança de página e oferece ajuda contextual
  useEffect(() => {
    if (isOpen) {
      const pageHelp = getPageContextHelp(pathname);
      if (pageHelp) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: pageHelp,
          },
        ]);
      }
    }
  }, [pathname, isOpen]);

  const getPageContextHelp = (path: string): string | null => {
    if (path.includes("/dashboard/caixa")) {
      return "📊 Você está no Caixa. Precisa de ajuda com pagamentos, descontos ou fechamento de contas?";
    }
    if (path.includes("/dashboard/agendamentos")) {
      return "📅 Você está em Agendamentos. Posso ajudar com confirmações, cancelamentos ou gestão de horários.";
    }
    if (path.includes("/dashboard/profissionais")) {
      return "👥 Você está em Profissionais. Precisa de ajuda com cadastro, horários ou associação de serviços?";
    }
    if (path.includes("/dashboard/servicos")) {
      return "✂️ Você está em Serviços. Posso explicar sobre preços, durações e gestão de serviços.";
    }
    if (path.includes("/dashboard/relatorios") || path.includes("/dashboard/financeiro")) {
      return "📈 Você está em Relatórios. Posso ajudar a interpretar métricas e análises financeiras.";
    }
    if (path.includes("/dashboard/usuarios")) {
      return "🔐 Você está em Usuários. Precisa de ajuda com permissões ou convites?";
    }
    if (path === "/dashboard") {
      return "🏠 Você está no Dashboard. Posso explicar as métricas ou ajudar a navegar pelo sistema.";
    }
    return null;
  };

  const getCurrentPageContext = () => {
    const segments = pathname.split("/").filter(Boolean);
    const currentPage = segments[segments.length - 1] || "dashboard";
    
    return {
      page: currentPage,
      fullPath: pathname,
      userRole,
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const context = getCurrentPageContext();
      
      const response = await fetch("/api/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Desculpe, ocorreu um erro. Por favor, tente novamente ou consulte a documentação.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "Como adicionar um profissional?",
    "Como funciona o caixa?",
    "Explicar sistema de permissões",
    "Como exportar relatórios?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <>
      {/* Botão flutuante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-pulseGlow group"
          aria-label="Abrir assistente"
        >
          <HelpCircle className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </button>
      )}

      {/* Chat expandido */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col animate-fadeIn overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-t-2xl flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                </span>
              </div>
              <div>
                <span className="font-semibold block">Assistente do Sistema</span>
                <span className="text-xs opacity-90">Online • Sempre disponível</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Fechar chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-background-alt/30 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-fadeIn`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-background border border-border rounded-bl-sm"
                  } shadow-sm`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start animate-fadeIn">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-background border border-border rounded-2xl rounded-bl-sm p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions (apenas quando chat está vazio) */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-border bg-background">
              <p className="text-xs text-muted-foreground mb-2">Perguntas rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-xs px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-background">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                size="icon"
                className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90"
              >
                {loading ? (
                  <Sparkles className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
