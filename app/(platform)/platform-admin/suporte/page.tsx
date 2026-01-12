"use client"

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  HeadphonesIcon,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Send,
} from "lucide-react"

interface SupportTicket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  salon?: {
    id: string
    name: string
  }
  messages: Array<{
    id: string
    content: string
    isStaff: boolean
    createdAt: string
    user: {
      name: string
    }
  }>
  _count?: {
    messages: number
  }
}

const STATUS_CONFIG = {
  OPEN: { label: "Aberto", icon: AlertCircle, color: "text-blue-600 bg-blue-50" },
  IN_PROGRESS: { label: "Em Andamento", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  RESOLVED: { label: "Resolvido", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
  CLOSED: { label: "Fechado", icon: XCircle, color: "text-gray-600 bg-gray-50" },
}

const PRIORITY_CONFIG = {
  LOW: { label: "Baixa", color: "text-gray-600 bg-gray-100" },
  MEDIUM: { label: "Média", color: "text-blue-600 bg-blue-100" },
  HIGH: { label: "Alta", color: "text-orange-600 bg-orange-100" },
  URGENT: { label: "Urgente", color: "text-red-600 bg-red-100" },
}

const CATEGORY_CONFIG = {
  TECHNICAL: { label: "Técnico", icon: "🔧" },
  BILLING: { label: "Financeiro", icon: "💰" },
  ACCOUNT: { label: "Conta", icon: "👤" },
  FEATURE: { label: "Recurso", icon: "✨" },
  OTHER: { label: "Outro", icon: "📋" },
}

export default function SuportePage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [search, statusFilter, priorityFilter, categoryFilter])

  async function fetchTickets() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      if (categoryFilter !== "all") params.append("category", categoryFilter)

      const response = await fetch(`/api/support/tickets?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error("Erro ao carregar tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleReply() {
    if (!selectedTicket || !replyContent.trim()) return

    setSending(true)
    try {
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, isStaff: true }),
      })

      if (response.ok) {
        setReplyContent("")
        // Atualizar ticket com nova mensagem
        const updatedResponse = await fetch(`/api/support/tickets/${selectedTicket.id}`)
        if (updatedResponse.ok) {
          const updatedTicket = await updatedResponse.json()
          setSelectedTicket(updatedTicket)
          fetchTickets() // Atualizar lista
        }
      }
    } catch (error) {
      console.error("Erro ao enviar resposta:", error)
    } finally {
      setSending(false)
    }
  }

  async function updateTicketStatus(ticketId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTickets()
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null))
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suporte</h1>
          <p className="text-muted-foreground">Gerencie tickets de suporte da plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <HeadphonesIcon className="h-4 w-4 mr-2" />
            {tickets.length} tickets
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="OPEN">Aberto</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="RESOLVED">Resolvido</SelectItem>
                <SelectItem value="CLOSED">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="MEDIUM">Média</SelectItem>
                <SelectItem value="LOW">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="TECHNICAL">Técnico</SelectItem>
                <SelectItem value="BILLING">Financeiro</SelectItem>
                <SelectItem value="ACCOUNT">Conta</SelectItem>
                <SelectItem value="FEATURE">Recurso</SelectItem>
                <SelectItem value="OTHER">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando tickets...</p>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="text-center">
              <HeadphonesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground">
                Ajuste os filtros ou aguarde novos tickets
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const StatusIcon = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG].icon
            const categoryConfig = CATEGORY_CONFIG[ticket.category as keyof typeof CATEGORY_CONFIG]
            const priorityConfig = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG]

            return (
              <Dialog key={ticket.id}>
                <DialogTrigger asChild>
                  <Card
                    className="glass-card cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{categoryConfig.icon}</span>
                            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG].color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG].label}
                            </Badge>
                            <Badge className={priorityConfig.color}>
                              {priorityConfig.label}
                            </Badge>
                            <Badge variant="outline">{categoryConfig.label}</Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 mb-1">
                            <User className="h-3 w-3" />
                            <span>{ticket.user.name}</span>
                          </div>
                          {ticket.salon && (
                            <div className="text-xs opacity-75">{ticket.salon.name}</div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{ticket._count?.messages || 0} mensagens</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <span className="text-2xl">{categoryConfig.icon}</span>
                      {selectedTicket?.subject}
                    </DialogTitle>
                    <DialogDescription>
                      Ticket #{selectedTicket?.id.slice(0, 8)} - {selectedTicket?.user.name}
                    </DialogDescription>
                  </DialogHeader>

                  {selectedTicket && (
                    <div className="space-y-4">
                      {/* Status Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Status:</span>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                          <Button
                            key={status}
                            variant={selectedTicket.status === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateTicketStatus(selectedTicket.id, status)}
                          >
                            <config.icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Button>
                        ))}
                      </div>

                      {/* Messages */}
                      <div className="space-y-3 max-h-[400px] overflow-y-auto p-4 bg-muted/30 rounded-lg">
                        {selectedTicket.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.isStaff
                                ? "bg-primary/10 ml-8"
                                : "bg-background mr-8"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                {message.isStaff ? "🛠️ Suporte" : "👤"} {message.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Digite sua resposta..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={4}
                        />
                        <div className="flex justify-end">
                          <Button onClick={handleReply} disabled={sending || !replyContent.trim()}>
                            <Send className="h-4 w-4 mr-2" />
                            {sending ? "Enviando..." : "Enviar Resposta"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )
          })}
        </div>
      )}
    </div>
  )
}
