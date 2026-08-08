"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Calendar, Clock, User, Phone, Mail, Search,
  Save, X as XIcon, Plus, AlertCircle, Check, UserCheck,
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { DashboardHeader } from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Client { id: string; name: string; email: string; phone?: string }
interface Staff { id: string; name: string; services?: { service: { id: string; name: string } }[] }
interface Service { id: string; name: string; duration: number; price: number }
interface TimeSlot { time: string; available: boolean }
interface BookingForm {
  clientId: string; clientName: string; clientEmail: string; clientPhone: string;
  serviceId: string; staffId: string; date: string; time: string; notes: string;
}

const formatPhone = (v: string) => {
  const n = v.replace(/\D/g, "");
  if (n.length <= 2) return n;
  if (n.length <= 3) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2, 3)} ${n.slice(3)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 3)} ${n.slice(3, 7)}-${n.slice(7, 11)}`;
};

const normalize = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifyClient, setNotifyClient] = useState(true);

  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);

  const [formData, setFormData] = useState<BookingForm>({
    clientId: "", clientName: "", clientEmail: "", clientPhone: "",
    serviceId: "", staffId: "", date: "", time: "", notes: "",
  });

  useEffect(() => { setMounted(true); }, []);

  // Load staff, services and clients
  useEffect(() => {
    fetch("/api/staff").then(r => r.json()).then(setStaff).catch(() => {});
    fetch("/api/services")
      .then(r => r.json())
      .then((d) => setServices(Array.isArray(d) ? d.filter((s: any) => s.active) : []))
      .catch(() => {});
    Promise.all([
      fetch("/api/bookings").then(r => r.ok ? r.json() : []),
      fetch("/api/users?role=CLIENT").then(r => r.ok ? r.json() : []),
    ]).then(([bookings, allClients]) => {
      const map = new Map<string, Client>();
      (Array.isArray(bookings) ? bookings : []).forEach((b: any) => map.set(b.client.id, b.client));
      (Array.isArray(allClients) ? allClients : []).forEach((c: any) => {
        if (!map.has(c.id)) map.set(c.id, { id: c.id, name: c.name, email: c.email, phone: c.phone });
      });
      setClients(Array.from(map.values()));
    }).catch(() => {});
  }, []);

  // Fetch slots when service/staff/date change
  useEffect(() => {
    if (!formData.serviceId || !formData.staffId || !formData.date) return;
    setLoadingSlots(true);
    fetch(`/api/schedule/available-slots?serviceId=${formData.serviceId}&staffId=${formData.staffId}&date=${formData.date}`)
      .then(r => r.json())
      .then(d => setAvailableSlots(d.slots || []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [formData.serviceId, formData.staffId, formData.date]);

  const filteredSuggestions = clients.filter(c =>
    normalize(c.name).includes(normalize(clientSearchTerm.trim()))
  );

  const getFilteredStaff = () => {
    if (!formData.serviceId) return staff;
    return staff.filter(s => s.services?.some(ss => ss.service.id === formData.serviceId));
  };

  const handleClientSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClientSearchTerm(val);
    setShowSuggestions(val.length > 0);
    setFormData(f => ({ ...f, clientName: val, clientId: "", clientEmail: "", clientPhone: "" }));
    const exact = clients.some(c => normalize(c.name) === normalize(val));
    setIsNewClient(!exact && val.length > 2);
  };

  const handleSelectClient = (c: Client) => {
    setFormData(f => ({
      ...f, clientId: c.id, clientName: c.name, clientEmail: c.email,
      clientPhone: c.phone ? formatPhone(c.phone) : "",
    }));
    setClientSearchTerm(c.name);
    setShowSuggestions(false);
    setIsNewClient(false);
  };

  const clearClient = () => {
    setFormData(f => ({ ...f, clientId: "", clientName: "", clientEmail: "", clientPhone: "" }));
    setClientSearchTerm("");
    setShowSuggestions(false);
    setIsNewClient(false);
  };

  const handleSubmit = async () => {
    if (!formData.clientName || !formData.clientEmail || !formData.serviceId || !formData.staffId || !formData.date || !formData.time) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      alert("E-mail inválido.");
      return;
    }

    try {
      setSaving(true);
      let clientId = formData.clientId;
      let isNew = false;

      if (!clientId) {
        const existing = clients.find(c => c.email.toLowerCase() === formData.clientEmail.toLowerCase());
        if (existing) {
          const use = window.confirm(`Cliente "${existing.name}" já cadastrado. Usar este cliente?`);
          clientId = use ? existing.id : "";
        }
        if (!clientId) {
          isNew = true;
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.clientName, email: formData.clientEmail,
              phone: formData.clientPhone.replace(/\D/g, ""),
              password: Math.random().toString(36).slice(-8), role: "CLIENT",
            }),
          });
          if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro ao criar cliente"); }
          clientId = (await res.json()).user.id;
        }
      }

      const [y, m, d] = formData.date.split("-").map(Number);
      const [h, min] = formData.time.split(":").map(Number);
      const dt = new Date();
      dt.setUTCFullYear(y); dt.setUTCMonth(m - 1); dt.setUTCDate(d);
      dt.setUTCHours(h, min, 0, 0);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, serviceId: formData.serviceId, staffId: formData.staffId, date: dt.toISOString(), notes: formData.notes }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Erro ao criar agendamento"); }
      const result = await res.json();

      if (notifyClient) {
        fetch("/api/email/booking-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: result.id, isNewClient: isNew }),
        }).catch(() => {});
      }

      router.push("/dashboard/agendamentos");
    } catch (err: any) {
      alert(err.message || "Erro ao criar agendamento.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Sparkles className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const svc = services.find(s => s.id === formData.serviceId);
  const stf = staff.find(s => s.id === formData.staffId);
  const morning = availableSlots.filter(s => parseInt(s.time) < 12);
  const afternoon = availableSlots.filter(s => parseInt(s.time) >= 12);

  const step1Done = !!formData.clientName;
  const step2Done = !!formData.serviceId && !!formData.staffId;
  const step3Done = !!formData.date && !!formData.time;
  const allDone = step1Done && step2Done && step3Done;

  const SlotGroup = ({ label, slots }: { label: string; slots: TimeSlot[] }) => (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {slots.map(slot => (
          <button
            key={slot.time}
            type="button"
            onClick={() => slot.available && setFormData(f => ({ ...f, time: slot.time }))}
            disabled={!slot.available}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] min-w-[56px]
              ${formData.time === slot.time
                ? "bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-md scale-105"
                : slot.available
                ? "border border-border bg-background-alt/60 hover:border-primary/40 hover:bg-primary/5 hover:scale-105"
                : "border border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed line-through"
              }`}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session?.user} />

      <GridBackground>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          {/* Page header */}
          <div className="mb-6 animate-fadeInUp">
            <Link href="/dashboard/agendamentos">
              <GradientButton variant="primary" className="mb-4 px-4 py-2 min-h-[44px] w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Agendamentos
              </GradientButton>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Novo Agendamento
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Preencha os dados abaixo para criar um agendamento. Campos com * são obrigatórios.
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 mb-6">
            {[
              { n: 1, label: "Cliente", done: step1Done },
              { n: 2, label: "Serviço", done: step2Done },
              { n: 3, label: "Data/Hora", done: step3Done },
              { n: 4, label: "Confirmar", done: allDone },
            ].map((step, i, arr) => (
              <div key={step.n} className="flex items-center gap-1 flex-1 min-w-0">
                <div className={`flex items-center gap-1.5 flex-shrink-0 ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all
                    ${step.done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                    {step.done ? "✓" : step.n}
                  </span>
                  <span className="text-xs font-medium hidden sm:block">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-px mx-1 transition-colors ${step.done ? "bg-primary/50" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {/* ── 1: Cliente ── */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Dados do Cliente
                </h2>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={clientSearchTerm}
                  onChange={handleClientSearch}
                  onFocus={() => { if (clientSearchTerm.length > 0 && !formData.clientId) setShowSuggestions(true); }}
                  placeholder="Buscar cliente pelo nome..."
                  className="pl-9 pr-10 h-11"
                  autoComplete="off"
                />
                {formData.clientId && (
                  <button type="button" onClick={clearClient} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <XIcon className="h-4 w-4" />
                  </button>
                )}

                {mounted && showSuggestions && filteredSuggestions.length > 0 && !formData.clientId && (
                  <div className="absolute z-50 w-full mt-1 glass-card border border-primary/20 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                    {filteredSuggestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectClient(c)}
                        className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0 flex items-center gap-3"
                      >
                        <span className="h-8 w-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {c.name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{c.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{c.email}{c.phone ? ` • ${formatPhone(c.phone)}` : ""}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {formData.clientId && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/25 bg-primary/5">
                  <span className="h-10 w-10 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {formData.clientName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{formData.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formData.clientEmail}{formData.clientPhone ? ` • ${formData.clientPhone}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">existente</span>
                </div>
              )}

              {!formData.clientId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isNewClient && (
                    <div className="col-span-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Plus className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs font-medium">Novo cliente será cadastrado automaticamente</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3 w-3" /> WhatsApp *</Label>
                    <Input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={e => setFormData(f => ({ ...f, clientPhone: formatPhone(e.target.value), clientId: "" }))}
                      placeholder="(99) 9 9999-9999"
                      maxLength={19}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3 w-3" /> E-mail *</Label>
                    <Input
                      type="email"
                      value={formData.clientEmail}
                      onChange={e => setFormData(f => ({ ...f, clientEmail: e.target.value, clientId: "" }))}
                      placeholder="email@exemplo.com"
                      className="h-10"
                    />
                  </div>
                </div>
              )}
            </GlassCard>

            {/* ── 2: Serviço e Profissional ── */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Serviço e Profissional
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Serviço *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={v => setFormData(f => ({ ...f, serviceId: v, staffId: "", time: "" }))}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.length === 0
                        ? <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum serviço ativo</div>
                        : services.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex flex-col py-0.5">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-xs text-muted-foreground">R$ {s.price.toFixed(2)} • {s.duration}min</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Profissional *</Label>
                  <Select
                    value={formData.staffId}
                    onValueChange={v => setFormData(f => ({ ...f, staffId: v }))}
                    disabled={!formData.serviceId}
                  >
                    <SelectTrigger className={`h-10 ${!formData.serviceId ? "opacity-50" : ""}`}>
                      <SelectValue placeholder={!formData.serviceId ? "Selecione o serviço primeiro" : "Selecione o profissional"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredStaff().length === 0
                        ? <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {!formData.serviceId ? "Selecione um serviço primeiro" : "Nenhum profissional disponível"}
                          </div>
                        : getFilteredStaff().map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {svc && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-alt/40 text-sm">
                  <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-foreground">{svc.name}</span>
                  <span className="text-muted-foreground text-xs">R$ {svc.price.toFixed(2)} • {svc.duration}min</span>
                  {stf && <><span className="text-border">|</span><UserCheck className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">{stf.name}</span></>}
                </div>
              )}
            </GlassCard>

            {/* ── 3: Data e Horário ── */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Data e Horário
                </h2>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data do Agendamento *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(f => ({ ...f, date: e.target.value, time: "" }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="cursor-pointer h-10 max-w-xs"
                />
              </div>

              {formData.date && formData.serviceId && formData.staffId && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Horários Disponíveis *
                  </Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center gap-3 py-10 rounded-xl border border-border bg-background-alt/30">
                      <Sparkles className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Carregando horários...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-10 rounded-xl border border-border bg-background-alt/30 text-center">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">Sem horários disponíveis</p>
                      <p className="text-xs text-muted-foreground mt-1">Tente outra data ou profissional</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-border bg-background-alt/30 space-y-4">
                      {morning.length > 0 && <SlotGroup label="Manhã" slots={morning} />}
                      {afternoon.length > 0 && <SlotGroup label="Tarde / Noite" slots={afternoon} />}
                      <p className="text-[11px] text-muted-foreground pt-1">
                        {availableSlots.filter(s => s.available).length} horários disponíveis
                        {formData.time && <span className="text-primary font-semibold"> · Selecionado: {formData.time}</span>}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>

            {/* ── 4: Finalizar ── */}
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border/50">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">4</span>
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" /> Finalizar
                </h2>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Observações (opcional)
                </Label>
                <Input
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ex: Cliente prefere corte mais curto nas laterais..."
                  className="h-10"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-alt/30">
                <Checkbox
                  id="notify"
                  checked={notifyClient}
                  onCheckedChange={v => setNotifyClient(v as boolean)}
                />
                <Label htmlFor="notify" className="cursor-pointer flex-1 text-sm">
                  Notificar cliente por e-mail/WhatsApp
                </Label>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Resumo */}
              {allDone && svc && (
                <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-2">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">Resumo do Agendamento</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="text-muted-foreground">Cliente</div>
                    <div className="font-medium text-foreground truncate">{formData.clientName}</div>
                    <div className="text-muted-foreground">Serviço</div>
                    <div className="font-medium text-foreground">{svc.name}</div>
                    {stf && <><div className="text-muted-foreground">Profissional</div><div className="font-medium text-foreground">{stf.name}</div></>}
                    <div className="text-muted-foreground">Data/Hora</div>
                    <div className="font-medium text-foreground">
                      {formData.date.split("-").reverse().join("/")} às {formData.time}
                    </div>
                    <div className="text-muted-foreground">Valor</div>
                    <div className="font-semibold text-primary">R$ {svc.price.toFixed(2)}</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button variant="outline" onClick={() => router.push("/dashboard/agendamentos")} disabled={saving} className="flex-1 h-11">
                  <XIcon className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <GradientButton variant="primary" onClick={handleSubmit} disabled={saving} className="flex-1 h-11">
                  {saving
                    ? <><Sparkles className="h-4 w-4 mr-2 animate-spin" />Criando...</>
                    : <><Save className="h-4 w-4 mr-2" />Criar Agendamento</>}
                </GradientButton>
              </div>
            </GlassCard>
          </div>
        </main>
      </GridBackground>
    </div>
  );
}
