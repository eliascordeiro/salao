"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  Upload,
  X,
  ImageIcon
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Salon {
  id: string;
  name: string;
  description: string | null;
  address: string;
  phone: string;
  email: string | null;
  openTime: string;
  closeTime: string;
  workDays: string;
  bookingType: string;
  active: boolean;
  coverPhoto: string | null;
}

const DAYS_OF_WEEK = [
  { id: "0", label: "Dom" },
  { id: "1", label: "Seg" },
  { id: "2", label: "Ter" },
  { id: "3", label: "Qua" },
  { id: "4", label: "Qui" },
  { id: "5", label: "Sex" },
  { id: "6", label: "Sáb" },
];

export default function MeuSalaoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    openTime: "09:00",
    closeTime: "19:00",
    workDays: "1,2,3,4,5",
    bookingType: "BOTH",
    active: true,
  });

  useEffect(() => {
    fetchSalon();
  }, []);

  const fetchSalon = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/salon/my-salon");
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao carregar informações do salão");
        return;
      }

      const data = await response.json();
      setSalon(data);
      
      setFormData({
        name: data.name || "",
        description: data.description || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        openTime: data.openTime || "09:00",
        closeTime: data.closeTime || "19:00",
        workDays: data.workDays || "1,2,3,4,5",
        bookingType: data.bookingType || "BOTH",
        active: data.active ?? true,
      });
    } catch (error) {
      console.error("Erro ao carregar salão:", error);
      setError("Erro ao carregar informações do salão");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const response = await fetch("/api/salon/my-salon", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar salão");
      }

      const updatedSalon = await response.json();
      setSalon(updatedSalon);
      setSuccess("Informações atualizadas com sucesso!");
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || "Erro ao atualizar salão");
    } finally {
      setSaving(false);
    }
  };

  const handleWorkDaysToggle = (dayId: string) => {
    const days = formData.workDays.split(",").filter(d => d);
    const index = days.indexOf(dayId);
    
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(dayId);
      days.sort();
    }
    
    setFormData({ ...formData, workDays: days.join(",") });
  };

  const handleCoverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecione uma imagem válida");
      return;
    }

    // Validação de tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB");
      return;
    }

    try {
      setUploadingCover(true);
      setError("");

      // Preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para API
      const formData = new FormData();
      formData.append('coverPhoto', file);

      const response = await fetch("/api/salon/upload-cover", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const { coverPhotoUrl } = await response.json();
      
      // Atualizar salão com nova foto
      setSalon(prev => prev ? { ...prev, coverPhoto: coverPhotoUrl } : null);
      setSuccess("Foto de capa atualizada com sucesso!");
      setTimeout(() => setSuccess(""), 3000);

    } catch (error: any) {
      setError(error.message || "Erro ao fazer upload da foto");
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!confirm("Deseja realmente remover a foto de capa?")) return;

    try {
      setUploadingCover(true);

      const response = await fetch("/api/salon/upload-cover", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao remover foto");
      }

      setSalon(prev => prev ? { ...prev, coverPhoto: null } : null);
      setCoverPreview(null);
      setSuccess("Foto de capa removida com sucesso!");
      setTimeout(() => setSuccess(""), 3000);

    } catch (error: any) {
      setError(error.message || "Erro ao remover foto");
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session?.user || { name: "", email: "", role: "CLIENT" }} />
        <GridBackground>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </GridBackground>
      </div>
    );
  }

  if (error && !salon) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session?.user || { name: "", email: "", role: "CLIENT" }} />
        <GridBackground>
          <div className="container mx-auto px-4 py-8">
            <GlassCard className="max-w-2xl mx-auto p-8 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Erro</h2>
              <p className="text-foreground-muted mb-6">{error}</p>
              <GradientButton onClick={() => router.push("/dashboard")}>
                Voltar ao Dashboard
              </GradientButton>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session?.user || { name: "", email: "", role: "CLIENT" }} />
      <GridBackground>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Informações do Salão
              </h1>
              <p className="text-foreground-muted">
                Gerencie as informações do seu estabelecimento
              </p>
            </div>

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 text-success flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Foto de Capa */}
            <GlassCard className="p-8 mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Foto de Capa
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Uma foto de capa atrativa aumenta suas chances de conversão. Tamanho recomendado: 1920x1080px (máx. 5MB)
              </p>

              <div className="space-y-4">
                {/* Preview da foto atual ou placeholder */}
                <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 group">
                  {coverPreview || salon?.coverPhoto ? (
                    <>
                      <Image
                        src={coverPreview || salon?.coverPhoto || ""}
                        alt="Foto de capa"
                        fill
                        className="object-cover"
                      />
                      {!uploadingCover && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleRemoveCoverPhoto}
                              className="gap-2"
                            >
                              <X className="h-4 w-4" />
                              Remover
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => document.getElementById('coverPhotoInput')?.click()}
                              className="gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Trocar
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <ImageIcon className="h-16 w-16 text-primary/40 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">Nenhuma foto de capa ainda</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('coverPhotoInput')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Fazer Upload
                      </Button>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                        <p className="text-white text-sm">Enviando imagem...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input file oculto */}
                <input
                  id="coverPhotoInput"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverPhotoUpload}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </div>
            </GlassCard>

            <GlassCard className="p-8 space-y-6">
              {/* Informações Básicas */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informações Básicas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Salão *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      minLength={3}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <textarea
                      id="description"
                      className="w-full px-4 py-3 rounded-xl border glass-card bg-background-alt/50 border-primary/20 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] placeholder:text-foreground-muted/50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do seu salão..."
                    />
                  </div>
                </div>
              </div>

              {/* Contato e Localização */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Contato e Localização
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Rua, número - Bairro - Cidade/UF"
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Horário de Funcionamento */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Horário de Funcionamento
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openTime">Hora de Abertura</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="closeTime">Hora de Fechamento</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="mb-3 block">Dias de Funcionamento</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isSelected = formData.workDays.split(",").includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => handleWorkDaysToggle(day.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-background-alt border border-border text-foreground-muted hover:border-primary"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-background-alt cursor-pointer hover:border-primary/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-semibold text-foreground">Salão Ativo</div>
                    <div className="text-sm text-foreground-muted">
                      Desmarque para pausar temporariamente os agendamentos
                    </div>
                  </div>
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <GradientButton
                  type="submit"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </GradientButton>
              </div>
            </GlassCard>
          </form>
        </div>
      </div>
      </GridBackground>
    </div>
  );
}
