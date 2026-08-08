"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  ImageIcon,
  Search
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
  latitude: number | null;
  longitude: number | null;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const DAY_KEYS = [
  { id: "0", key: "daySun" },
  { id: "1", key: "dayMon" },
  { id: "2", key: "dayTue" },
  { id: "3", key: "dayWed" },
  { id: "4", key: "dayThu" },
  { id: "5", key: "dayFri" },
  { id: "6", key: "daySat" },
] as const;

export default function MeuSalaoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations("salon");
  const tCommon = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    address: "", // Mantém para compatibilidade com backend
    phone: "",
    email: "",
    openTime: "09:00",
    closeTime: "19:00",
    workDays: "1,2,3,4,5",
    bookingType: "BOTH",
    active: true,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  useEffect(() => {
    fetchSalon();
  }, []);

  useEffect(() => {
    console.log("FormData.cep mudou:", formData.cep); // Debug
  }, [formData.cep]);

  const fetchSalon = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/salon/my-salon");
      
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t("loadError"));
        return;
      }

      const data = await response.json();
      setSalon(data);
      
      // Usar campos separados se existirem, senão tentar parsear o endereço
      const addressParts = data.street ? {
        cep: data.zipCode || "",
        street: data.street || "",
        number: data.number || "",
        complement: data.complement || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
      } : parseAddress(data.address || "");
      
      // Formatar CEP com hífen
      const formattedCep = addressParts.cep ? 
        addressParts.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : "";
      
      setFormData({
        name: data.name || "",
        description: data.description || "",
        cep: formattedCep,
        street: addressParts.street || "",
        number: addressParts.number || "",
        complement: addressParts.complement || "",
        neighborhood: addressParts.neighborhood || "",
        city: addressParts.city || "",
        state: addressParts.state || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        openTime: data.openTime || "09:00",
        closeTime: data.closeTime || "19:00",
        workDays: data.workDays || "1,2,3,4,5",
        bookingType: data.bookingType || "BOTH",
        active: data.active ?? true,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      });
    } catch (error) {
      console.error("Erro ao carregar salão:", error);
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para parsear endereço antigo
  const parseAddress = (address: string) => {
    // Tenta extrair informações do endereço existente
    // Formato esperado: "Rua, numero - Bairro - Cidade/UF"
    const parts = {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    };

    try {
      const segments = address.split(" - ");
      if (segments.length >= 3) {
        const streetAndNumber = segments[0].split(", ");
        parts.street = streetAndNumber[0] || "";
        parts.number = streetAndNumber[1] || "";
        parts.neighborhood = segments[1] || "";
        
        const cityState = segments[2].split("/");
        parts.city = cityState[0] || "";
        parts.state = cityState[1] || "";
      }
    } catch (e) {
      // Se falhar, retorna vazio
    }

    return parts;
  };

  const searchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) {
      return;
    }

    setSearchingCep(true);
    setError("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error("Erro ao buscar CEP");
      }

      const data: ViaCepResponse = await response.json();
      
      if (data.erro) {
        setError(t("cepNotFound"));
        return;
      }

      setFormData(prev => ({
        ...prev,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }));
      
      // Buscar coordenadas GPS via Nominatim
      try {
        const addressString = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brasil`;
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
          {
            headers: {
              'User-Agent': 'SalaoApp/1.0'
            }
          }
        );
        const geoData = await geoResponse.json();
        
        if (geoData && geoData[0]) {
          const lat = parseFloat(geoData[0].lat);
          const lon = parseFloat(geoData[0].lon);
          
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));
          
          console.log("📍 Coordenadas obtidas:", lat, lon);
        } else {
          console.warn("⚠️ Coordenadas não encontradas para este endereço");
        }
      } catch (geoError) {
        console.error("Erro ao buscar coordenadas:", geoError);
      }
      
      setSuccess(t("cepFoundHint"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setError(t("cepSearchError"));
    } finally {
      setSearchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    console.log("Input value:", inputValue); // Debug
    
    let value = inputValue.replace(/\D/g, "");
    console.log("Apenas números:", value); // Debug
    
    // Limita a 8 dígitos
    value = value.slice(0, 8);
    
    // Formata CEP: 00000-000
    if (value.length > 5) {
      value = value.slice(0, 5) + "-" + value.slice(5);
    }
    
    console.log("CEP formatado:", value); // Debug
    
    setFormData(prev => {
      console.log("Estado anterior:", prev.cep); // Debug
      console.log("Novo valor:", value); // Debug
      return { ...prev, cep: value };
    });
    
    // Busca automaticamente quando completar 8 dígitos
    const cleanCep = value.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      console.log("Buscando CEP:", cleanCep); // Debug
      searchCep(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      // Monta o endereço completo no formato esperado pelo backend
      const fullAddress = `${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ""} - ${formData.neighborhood} - ${formData.city}/${formData.state}`;
      
      const dataToSend = {
        ...formData,
        address: fullAddress,
      };

      const response = await fetch("/api/salon/my-salon", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("updateError"));
      }

      const updatedSalon = await response.json();
      setSalon(updatedSalon);
      setSuccess(t("updateSuccess"));
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (error: any) {
      setError(error.message || t("updateError"));
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
      setError(t("invalidImage"));
      return;
    }

    // Validação de tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t("imageTooLarge"));
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
      setSuccess(t("coverUpdated"));
      setTimeout(() => setSuccess(""), 3000);

    } catch (error: any) {
      setError(error.message || t("uploadError"));
      setCoverPreview(null);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleRemoveCoverPhoto = async () => {
    if (!confirm(t("removeCoverConfirm"))) return;

    try {
      setUploadingCover(true);

      const response = await fetch("/api/salon/upload-cover", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(t("removeError"));
      }

      setSalon(prev => prev ? { ...prev, coverPhoto: null } : null);
      setCoverPreview(null);
      setSuccess(t("coverRemoved"));
      setTimeout(() => setSuccess(""), 3000);

    } catch (error: any) {
      setError(error.message || t("removeError"));
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
              <h2 className="text-2xl font-bold text-foreground mb-2">{t("errorTitle")}</h2>
              <p className="text-foreground-muted mb-6">{error}</p>
              <GradientButton onClick={() => router.push("/dashboard")}>
                {t("backToDashboard")}
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
        <div className="py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t("pageTitle")}
              </h1>
              <p className="text-foreground-muted">
                {t("pageSubtitle")}
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
            <GlassCard className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                {t("coverPhotoTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {t("coverPhotoHint")}
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
                              {t("removePhoto")}
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={() => document.getElementById('coverPhotoInput')?.click()}
                              className="gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              {t("changePhoto")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <ImageIcon className="h-16 w-16 text-primary/40 mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">{t("noPhotoYet")}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('coverPhotoInput')?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        {t("uploadPhoto")}
                      </Button>
                    </div>
                  )}

                  {/* Loading overlay */}
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" />
                        <p className="text-white text-sm">{t("uploadingPhoto")}</p>
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

            <GlassCard className="p-6 md:p-8 space-y-8">
              {/* Informações Básicas */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {t("basicInfoTitle")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{t("salonNameLabel")} *</Label>
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
                    <Label htmlFor="email">{tCommon("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">{t("description")}</Label>
                    <textarea
                      id="description"
                      className="w-full px-4 py-3 rounded-xl border glass-card bg-background-alt/50 border-primary/20 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px] placeholder:text-foreground-muted/50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t("descriptionPlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Contato e Localização */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t("contactLocationTitle")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">{tCommon("phone")}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder={t("phonePlaceholder")}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>
                </div>

                {/* Endereço Completo */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("addressTitle")}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* CEP com busca */}
                    <div>
                      <Label htmlFor="cep">{t("cepLabel")}</Label>
                      <div className="relative">
                        <Input
                          id="cep"
                          type="text"
                          value={formData.cep}
                          onChange={handleCepChange}
                          placeholder="00000-000"
                          maxLength={9}
                          autoComplete="off"
                          className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground pr-10"
                        />
                        {searchingCep && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                        )}
                        {!searchingCep && formData.cep.replace(/\D/g, "").length === 8 && (
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{t("autoSearchHint")}</p>
                    </div>

                    {/* Rua */}
                    <div className="md:col-span-2">
                      <Label htmlFor="street">{t("streetLabel")}</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        placeholder={t("streetPlaceholder")}
                        className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <Label htmlFor="number">{t("numberLabel")}</Label>
                      <Input
                        id="number"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        placeholder="123"
                        className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                      />
                    </div>

                    {/* Complemento */}
                    <div>
                      <Label htmlFor="complement">{t("complementLabel")}</Label>
                      <Input
                        id="complement"
                        value={formData.complement}
                        onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                        placeholder={t("complementPlaceholder")}
                        className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                      />
                    </div>

                    {/* Bairro */}
                    <div>
                      <Label htmlFor="neighborhood">{t("neighborhoodLabel")}</Label>
                      <Input
                        id="neighborhood"
                        value={formData.neighborhood}
                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                        placeholder={t("neighborhoodPlaceholder")}
                        className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                      />
                    </div>

                    {/* Cidade */}
                    <div>
                      <Label htmlFor="city">{t("city")}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder={t("cityPlaceholder")}
                        className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                      />
                    </div>

                    {/* Estado */}
                    <div>
                      <Label htmlFor="state">{t("state")}</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        placeholder="UF"
                        maxLength={2}
                        className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Horário de Funcionamento */}
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {t("businessHoursTitle")}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openTime">{t("openTimeLabel")}</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                      className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="closeTime">{t("closeTimeLabel")}</Label>
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
                  <Label className="mb-3 block">{t("workDaysLabel")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_KEYS.map((day) => {
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
                          {t(day.key)}
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
                    <div className="font-semibold text-foreground">{t("activeLabel")}</div>
                    <div className="text-sm text-foreground-muted">
                      {t("activeHint")}
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
                      {t("saving")}
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      {t("saveChanges")}
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
