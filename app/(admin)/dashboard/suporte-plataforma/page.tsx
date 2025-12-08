"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  MessageSquare,
  Send,
  AlertCircle,
  Plus,
  Headset,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardHeader } from "@/components/dashboard/header";
import { useSession } from "next-auth/react";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "OPEN", label: "Abertos", color: "text-red-500" },
  { value: "IN_PROGRESS", label: "Em Andamento", color: "text-yellow-500" },
  { value: "RESOLVED", label: "Resolvidos", color: "text-green-500" },
  { value: "CLOSED", label: "Fechados", color: "text-gray-500" },
];

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "Todas" },
  { value: "BUG", label: "Bug/Erro Técnico" },
  { value: "FEATURE_REQUEST", label: "Solicitação de Funcionalidade" },
  { value: "QUESTION", label: "Dúvida sobre Sistema" },
  { value: "INTEGRATION", label: "Problema de Integração" },
  { value: "BILLING", label: "Faturamento/Assinatura" },
  { value: "OTHER", label: "Outro" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Baixa", color: "bg-blue-500" },
  { value: "MEDIUM", label: "Média", color: "bg-yellow-500" },
  { value: "HIGH", label: "Alta", color: "bg-orange-500" },
  { value: "URGENT", label: "Urgente", color: "bg-red-500" },
];

interface PlatformTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  salon: {
    id: string;
    name: string;
  };
  messages: Array<{
    id: string;
    name: string;
    message: string;
    isSupport: boolean;
    createdAt: string;
  }>;
}

export default function SuportePlataformaPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<PlatformTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<PlatformTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<PlatformTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  
  // Form para novo ticket
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/platform-support/tickets");
      
      if (!response.ok) {
        console.error("Erro na resposta:", response.status);
        setTickets([]);
        return;
      }
      
      const data = await response.json();
      
      // Verificar se data é um array
      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        console.error("Resposta inválida:", data);
        setTickets([]);
      }
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.ticketNumber.toString().includes(searchTerm)
      );
    }

    setFilteredTickets(filtered);
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.category || !newTicket.description) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setSending(true);
      const response = await fetch("/api/platform-support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        setShowNewTicketModal(false);
        setNewTicket({
          subject: "",
          category: "",
          description: "",
          priority: "MEDIUM",
        });
        fetchTickets();
        alert("Chamado criado com sucesso! Nossa equipe entrará em contato em breve.");
      } else {
        alert("Erro ao criar chamado");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao criar chamado");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setSending(true);
      const response = await fetch(
        `/api/platform-support/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (response.ok) {
        setNewMessage("");
        fetchTickets();
        // Recarregar ticket selecionado
        const updatedTicket = tickets.find((t) => t.id === selectedTicket.id);
        if (updatedTicket) {
          const detailsResponse = await fetch(
            `/api/platform-support/tickets/${selectedTicket.id}`
          );
          const details = await detailsResponse.json();
          setSelectedTicket(details);
        }
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm("Tem certeza que deseja fechar este chamado?")) return;

    try {
      const response = await fetch(`/api/platform-support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      if (response.ok) {
        fetchTickets();
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error("Erro ao fechar ticket:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "RESOLVED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "CLOSED":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <Ticket className="h-5 w-5" />;
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando chamados...</p>
      </div>
    );
  }

  return (
    <>
      {session?.user && (
        <DashboardHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Headset className="h-6 w-6 sm:h-8 sm:w-8" />
              Suporte da Plataforma
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Abra chamados para nossa equipe de suporte técnico
            </p>
          </div>

          <Button
            onClick={() => setShowNewTicketModal(true)}
            className="w-full sm:w-auto gap-2 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Abrir Chamado
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Ticket className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abertos</p>
                  <p className="text-2xl font-bold text-red-500">{stats.open}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-yellow-500">
                    {stats.inProgress}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolvidos</p>
                  <p className="text-2xl font-bold text-green-500">
                    {stats.resolved}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Número ou assunto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Meus Chamados ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Headset className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  Nenhum chamado encontrado
                </p>
                <p className="text-sm">
                  Abra um chamado se precisar de ajuda com a plataforma
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(ticket.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{ticket.ticketNumber}
                          </span>
                          <span className="font-semibold">{ticket.subject}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              PRIORITY_OPTIONS.find(
                                (p) => p.value === ticket.priority
                              )?.color
                            } text-white`}
                          >
                            {
                              PRIORITY_OPTIONS.find(
                                (p) => p.value === ticket.priority
                              )?.label
                            }
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span>
                            {
                              CATEGORY_OPTIONS.find(
                                (c) => c.value === ticket.category
                              )?.label
                            }
                          </span>
                          <span>
                            {format(
                              new Date(ticket.createdAt),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                          {ticket.messages.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {ticket.messages.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Novo Chamado */}
        <Dialog open={showNewTicketModal} onOpenChange={setShowNewTicketModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Abrir Novo Chamado</DialogTitle>
              <DialogDescription>
                Descreva seu problema ou solicitação. Nossa equipe responderá em
                breve.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Assunto *</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder="Ex: Erro ao gerar relatório financeiro"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria *</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) =>
                      setNewTicket({ ...newTicket, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.filter((c) => c.value !== "ALL").map(
                        (opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) =>
                      setNewTicket({ ...newTicket, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Descrição Detalhada *</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  placeholder="Descreva o problema em detalhes: o que aconteceu, quando aconteceu, passos para reproduzir, etc."
                  rows={6}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewTicketModal(false)}
                  disabled={sending}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateTicket} disabled={sending}>
                  {sending ? "Criando..." : "Abrir Chamado"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal: Detalhes do Ticket */}
        <Dialog
          open={!!selectedTicket}
          onOpenChange={() => setSelectedTicket(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    #{selectedTicket.ticketNumber} - {selectedTicket.subject}
                  </DialogTitle>
                  <DialogDescription>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(selectedTicket.status)}
                        {
                          STATUS_OPTIONS.find(
                            (s) => s.value === selectedTicket.status
                          )?.label
                        }
                      </span>
                      <span>
                        {
                          CATEGORY_OPTIONS.find(
                            (c) => c.value === selectedTicket.category
                          )?.label
                        }
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs text-white ${
                          PRIORITY_OPTIONS.find(
                            (p) => p.value === selectedTicket.priority
                          )?.color
                        }`}
                      >
                        {
                          PRIORITY_OPTIONS.find(
                            (p) => p.value === selectedTicket.priority
                          )?.label
                        }
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Descrição Original */}
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium mb-2">
                        Descrição Original:
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Criado em{" "}
                        {format(
                          new Date(selectedTicket.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Mensagens */}
                  {selectedTicket.messages.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Conversação</h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {selectedTicket.messages.map((msg) => (
                          <Card
                            key={msg.id}
                            className={
                              msg.isSupport ? "bg-primary/5" : "bg-muted/30"
                            }
                          >
                            <CardContent className="pt-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                    msg.isSupport
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  }`}
                                >
                                  {msg.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {msg.name}
                                    </span>
                                    {msg.isSupport && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                                        Suporte
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {format(
                                        new Date(msg.createdAt),
                                        "dd/MM/yyyy HH:mm",
                                        { locale: ptBR }
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">
                                    {msg.message}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nova Mensagem */}
                  {selectedTicket.status !== "CLOSED" && (
                    <div>
                      <Label>Adicionar Mensagem</Label>
                      <div className="flex gap-2 mt-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Digite sua mensagem..."
                          rows={3}
                          disabled={sending}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={sending || !newMessage.trim()}
                          className="self-end"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  {selectedTicket.status === "RESOLVED" && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => handleCloseTicket(selectedTicket.id)}
                      >
                        Fechar Chamado
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
