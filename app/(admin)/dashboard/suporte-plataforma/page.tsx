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
import { useTranslations } from "next-intl";

const STATUS_VALUES = [
  { value: "ALL" },
  { value: "OPEN", color: "text-red-500" },
  { value: "IN_PROGRESS", color: "text-yellow-500" },
  { value: "RESOLVED", color: "text-green-500" },
  { value: "CLOSED", color: "text-gray-500" },
];

const CATEGORY_VALUES = [
  { value: "ALL" },
  { value: "BUG" },
  { value: "FEATURE_REQUEST" },
  { value: "QUESTION" },
  { value: "INTEGRATION" },
  { value: "BILLING" },
  { value: "OTHER" },
];

const PRIORITY_VALUES = [
  { value: "LOW", color: "bg-blue-500" },
  { value: "MEDIUM", color: "bg-yellow-500" },
  { value: "HIGH", color: "bg-orange-500" },
  { value: "URGENT", color: "bg-red-500" },
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
  const t = useTranslations("platformSupport");
  const tSupport = useTranslations("support");
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
      alert(t("fillRequiredFields"));
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
        alert(t("ticketCreatedSuccess"));
      } else {
        alert(t("ticketCreatedError"));
      }
    } catch (error) {
      console.error("Erro:", error);
      alert(t("ticketCreatedError"));
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
    if (!confirm(t("confirmCloseTicket"))) return;

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

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ALL: t("statusAll"),
      OPEN: t("statusOpen"),
      IN_PROGRESS: t("statusInProgress"),
      RESOLVED: t("statusResolved"),
      CLOSED: t("statusClosed"),
    };
    return map[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      ALL: t("categoryAll"),
      BUG: t("categoryBug"),
      FEATURE_REQUEST: t("categoryFeatureRequest"),
      QUESTION: t("categoryQuestion"),
      INTEGRATION: t("categoryIntegration"),
      BILLING: t("categoryBilling"),
      OTHER: t("categoryOther"),
    };
    return map[category] || category;
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      LOW: tSupport("priorityLow"),
      MEDIUM: tSupport("priorityMedium"),
      HIGH: tSupport("priorityHigh"),
      URGENT: tSupport("priorityUrgent"),
    };
    return map[priority] || priority;
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
        <p>{t("loadingTickets")}</p>
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
              {t("title")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {t("subtitle")}
            </p>
          </div>

          <Button
            onClick={() => setShowNewTicketModal(true)}
            className="w-full sm:w-auto gap-2 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            {t("openTicketButton")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("statTotal")}</p>
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
                  <p className="text-sm text-muted-foreground">{t("statusOpen")}</p>
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
                  <p className="text-sm text-muted-foreground">{t("statusInProgress")}</p>
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
                  <p className="text-sm text-muted-foreground">{t("statusResolved")}</p>
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
                <Label>{t("searchLabel")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label>{t("statusLabel")}</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_VALUES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {getStatusLabel(opt.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t("categoryLabel")}</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_VALUES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {getCategoryLabel(opt.value)}
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
            <CardTitle>{t("ticketsListTitle", { count: filteredTickets.length })}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Headset className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {t("noTicketsFound")}
                </p>
                <p className="text-sm">
                  {t("noTicketsFoundDesc")}
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
                              PRIORITY_VALUES.find(
                                (p) => p.value === ticket.priority
                              )?.color
                            } text-white`}
                          >
                            {getPriorityLabel(ticket.priority)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span>
                            {getCategoryLabel(ticket.category)}
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
              <DialogTitle>{t("newTicketModalTitle")}</DialogTitle>
              <DialogDescription>
                {t("newTicketModalDesc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>{t("subjectLabel")}</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder={t("subjectPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t("categoryRequiredLabel")}</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value) =>
                      setNewTicket({ ...newTicket, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("categoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_VALUES.filter((c) => c.value !== "ALL").map(
                        (opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {getCategoryLabel(opt.value)}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t("priorityLabel")}</Label>
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
                      {PRIORITY_VALUES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {getPriorityLabel(opt.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{t("descriptionLabel")}</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  placeholder={t("descriptionPlaceholder")}
                  rows={6}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewTicketModal(false)}
                  disabled={sending}
                >
                  {t("cancelButton")}
                </Button>
                <Button onClick={handleCreateTicket} disabled={sending}>
                  {sending ? t("creatingButton") : t("openTicketButton")}
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
                        {getStatusLabel(selectedTicket.status)}
                      </span>
                      <span>
                        {getCategoryLabel(selectedTicket.category)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs text-white ${
                          PRIORITY_VALUES.find(
                            (p) => p.value === selectedTicket.priority
                          )?.color
                        }`}
                      >
                        {getPriorityLabel(selectedTicket.priority)}
                      </span>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Descrição Original */}
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium mb-2">
                        {t("originalDescription")}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        {t("createdAtLabel")}{" "}
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
                      <h4 className="font-semibold mb-3">{t("conversation")}</h4>
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
                                        {t("supportBadge")}
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
                      <Label>{t("addMessageLabel")}</Label>
                      <div className="flex gap-2 mt-2">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={t("messagePlaceholder")}
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
                        {t("closeTicketButton")}
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
