"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  Filter,
  MessageSquare,
  Send,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_VALUES = ["ALL", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-red-500",
  IN_PROGRESS: "text-yellow-500",
  RESOLVED: "text-green-500",
  CLOSED: "text-gray-500",
};

const CATEGORY_VALUES = ["ALL", "TECNICO", "FATURAMENTO", "DUVIDA", "SUGESTAO", "RECLAMACAO"] as const;

const PRIORITY_VALUES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-blue-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

interface Ticket {
  id: string;
  ticketNumber: number;
  name: string;
  email: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  messages: Array<{
    id: string;
    name: string;
    message: string;
    isStaff: boolean;
    createdAt: string;
  }>;
}

export default function SuportePage() {
  const t = useTranslations("support");
  const tCommon = useTranslations("common");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, statusFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/support/tickets");
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      console.error("Erro ao carregar tickets:", error);
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
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.ticketNumber.toString().includes(searchTerm)
      );
    }

    setFilteredTickets(filtered);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTickets();
        if (selectedTicket?.id === ticketId) {
          const updatedTicket = await response.json();
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `/api/support/tickets/${selectedTicket.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: newMessage }),
        }
      );

      if (response.ok) {
        setNewMessage("");
        // Recarregar ticket
        const ticketResponse = await fetch(
          `/api/support/tickets/${selectedTicket.id}`
        );
        const updatedTicket = await ticketResponse.json();
        setSelectedTicket(updatedTicket);
        fetchTickets();
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "RESOLVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "CLOSED":
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Ticket className="w-5 h-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      ALL: tCommon("all"),
      OPEN: t("statusOpen"),
      IN_PROGRESS: t("statusInProgress"),
      RESOLVED: t("statusResolved"),
      CLOSED: t("statusClosed"),
    };
    return map[status] || status;
  };

  const getCategoryLabel = (category: string) => {
    const map: Record<string, string> = {
      ALL: tCommon("all"),
      TECNICO: t("categoryTechnical"),
      FATURAMENTO: t("categoryBilling"),
      DUVIDA: t("categoryQuestion"),
      SUGESTAO: t("categorySuggestion"),
      RECLAMACAO: t("categoryComplaint"),
    };
    return map[category] || category;
  };

  const getPriorityLabel = (priority: string) => {
    const map: Record<string, string> = {
      LOW: t("priorityLow"),
      MEDIUM: t("priorityMedium"),
      HIGH: t("priorityHigh"),
      URGENT: t("priorityUrgent"),
    };
    return map[priority] || priority;
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("adminTitle")}</h1>
        <p className="text-muted-foreground">
          {t("adminSubtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{tCommon("total")}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="w-8 h-8 text-muted-foreground" />
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
              <AlertCircle className="w-8 h-8 text-red-500" />
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
              <Clock className="w-8 h-8 text-yellow-500" />
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
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>{tCommon("search")}</Label>
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
              <Label>{tCommon("status")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {getStatusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t("category")}</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_VALUES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {getCategoryLabel(value)}
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
          <CardTitle>{t("ticketsCount", { count: filteredTickets.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noTicketsFound")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(ticket.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{ticket.ticketNumber}
                        </span>
                        <span className="font-semibold">{ticket.subject}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            PRIORITY_COLORS[ticket.priority]
                          } text-white`}
                        >
                          {getPriorityLabel(ticket.priority)}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span>{ticket.name}</span>
                        <span>{ticket.email}</span>
                        <span>
                          {getCategoryLabel(ticket.category)}
                        </span>
                        <span>
                          {format(
                            new Date(ticket.createdAt),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="w-4 h-4" />
                      {ticket.messages?.length || 0}
                    </div>
                    <Button size="sm" variant="ghost">
                      {t("viewDetails")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => setSelectedTicket(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Ticket #{selectedTicket?.ticketNumber} - {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.name} • {selectedTicket?.email}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Status & Priority */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>{tCommon("status")}</Label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) =>
                      updateTicketStatus(selectedTicket.id, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_VALUES.filter((s) => s !== "ALL").map(
                        (value) => (
                          <SelectItem key={value} value={value}>
                            {getStatusLabel(value)}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label>{t("priority")}</Label>
                  <Select value={selectedTicket.priority} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {getPriorityLabel(value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Messages */}
              <div>
                <Label className="mb-4 block">{t("conversationLabel")}</Label>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/20">
                  {selectedTicket.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.isStaff
                          ? "bg-primary/10 ml-8"
                          : "bg-background mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">
                          {msg.name} {msg.isStaff && "🛡️"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.createdAt), "dd/MM HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="space-y-2">
                  <Textarea
                    placeholder={t("replyPlaceholder")}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="w-full"
                  >
                    {sending ? (
                      t("sendingReply")
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        {t("sendReply")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
