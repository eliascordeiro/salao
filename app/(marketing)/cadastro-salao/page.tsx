"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { GridBackground } from "@/components/ui/grid-background";
import { Briefcase, Loader2, ArrowLeft, Store, User, MapPin, Phone, Mail, Lock, CheckCircle, Calendar, Users, Search } from "lucide-react";
import Link from "next/link";

export default function CadastroSalaoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  // Dados do proprietário
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerPasswordConfirm, setOwnerPasswordConfirm] = useState("");
  
  // Dados do salão
  const [salonName, setSalonName] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonNumber, setSalonNumber] = useState("");
  const [salonCity, setSalonCity] = useState("");
  const [salonState, setSalonState] = useState("");
  const [salonZipCode, setSalonZipCode] = useState("");
  const [salonDescription, setSalonDescription] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Buscar CEP via ViaCEP
  async function handleCepSearch() {
    const cep = salonZipCode.replace(/\D/g, ""); // Remove caracteres não numéricos
    
    if (cep.length !== 8) {
      setErrors({ ...errors, salonZipCode: "CEP deve ter 8 dígitos" });
      return;
    }
    
    setLoadingCep(true);
    setErrors({ ...errors, salonZipCode: "" });
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        setErrors({ ...errors, salonZipCode: "CEP não encontrado" });
        return;
      }
      
      // Preencher campos automaticamente
      setSalonAddress(data.logradouro || "");
      setSalonCity(data.localidade || "");
      setSalonState(data.uf || "");
      
      // Tentar obter coordenadas (usando Nominatim - OpenStreetMap)
      try {
        const addressString = `${data.logradouro}, ${data.localidade}, ${data.uf}, Brazil`;
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`
        );
        const geoData = await geoResponse.json();
        
        if (geoData && geoData[0]) {
          setLatitude(parseFloat(geoData[0].lat));
          setLongitude(parseFloat(geoData[0].lon));
          console.log("📍 Coordenadas obtidas:", geoData[0].lat, geoData[0].lon);
        }
      } catch (geoError) {
        console.warn("⚠️ Não foi possível obter coordenadas:", geoError);
        // Não bloqueia o cadastro se não conseguir coordenadas
      }
      
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setErrors({ ...errors, salonZipCode: "Erro ao buscar CEP. Tente novamente." });
    } finally {
      setLoadingCep(false);
    }
  }
  
  // Validar passo 1 (dados do proprietário)
  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!ownerName.trim()) {
      newErrors.ownerName = "Nome é obrigatório";
    }
    
    if (!ownerEmail.trim()) {
      newErrors.ownerEmail = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(ownerEmail)) {
      newErrors.ownerEmail = "Email inválido";
    }
    
    if (!ownerPassword) {
      newErrors.ownerPassword = "Senha é obrigatória";
    } else if (ownerPassword.length < 6) {
      newErrors.ownerPassword = "Senha deve ter no mínimo 6 caracteres";
    }
    
    if (ownerPassword !== ownerPasswordConfirm) {
      newErrors.ownerPasswordConfirm = "As senhas não coincidem";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  
  // Validar passo 2 (dados do salão)
  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    
    if (!salonName.trim()) {
      newErrors.salonName = "Nome do salão é obrigatório";
    }
    
    if (!salonPhone.trim()) {
      newErrors.salonPhone = "Telefone é obrigatório";
    }
    
    if (!salonAddress.trim()) {
      newErrors.salonAddress = "Endereço é obrigatório";
    }
    
    if (!salonNumber.trim()) {
      newErrors.salonNumber = "Número é obrigatório";
    }
    
    if (!salonCity.trim()) {
      newErrors.salonCity = "Cidade é obrigatória";
    }
    
    if (!salonState.trim()) {
      newErrors.salonState = "Estado é obrigatório";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
  
  // Avançar para passo 2
  function handleNextStep() {
    if (validateStep1()) {
      setStep(2);
      setErrors({});
    }
  }
  
  // Submeter cadastro
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Criar conta e salão
      const response = await fetch("/api/auth/register-salon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Dados do proprietário
          ownerName,
          ownerEmail,
          ownerPassword,
          // Dados do salão
          salonName,
          salonPhone,
          salonAddress,
          salonNumber,
          salonCity,
          salonState,
          salonZipCode,
          salonDescription,
          latitude,
          longitude,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Login automático
        console.log("✅ Conta criada com sucesso, fazendo login...");
        
        const signInResult = await signIn("credentials", {
          email: ownerEmail,
          password: ownerPassword,
          redirect: false,
        });
        
        if (signInResult?.ok) {
          console.log("✅ Login automático realizado, redirecionando...");
          
          // Aguardar um momento para sessão ser atualizada
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Redirecionar para dashboard com mensagem de sucesso
          router.push("/dashboard?welcome=true");
          router.refresh();
        } else {
          console.error("❌ Erro no login automático:", signInResult?.error);
          // Se login automático falhar, redirecionar para página de login
          router.push("/login?registered=true");
        }
      } else {
        // Verificar se é erro de email duplicado
        if (result.error?.includes("email já está cadastrado") || result.error?.includes("Email já cadastrado")) {
          setErrors({ 
            ownerEmail: "Este email já está cadastrado. Use outro email ou faça login.",
            submit: result.error 
          });
          setStep(1); // Voltar para o passo 1
        } else {
          setErrors({ submit: result.error || "Erro ao criar cadastro" });
        }
      }
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setErrors({ submit: "Erro ao criar cadastro. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }
  
  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  ];
  
  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="space-y-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para início
            </Button>
          </Link>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Store className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Cadastre seu Salão</h1>
            </div>
            <p className="text-muted-foreground">
              Junte-se à maior plataforma de agendamentos para salões e barbearias
            </p>
          </div>
        </div>
        
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
          </div>
          <div className={`w-20 h-1 ${step > 1 ? "bg-primary" : "bg-muted"}`} />
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            2
          </div>
        </div>
        
        <Card className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PASSO 1: Dados do Proprietário */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <User className="h-5 w-5" />
                  <span>Dados do Proprietário</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Nome completo *</Label>
                  <Input
                    id="ownerName"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Seu nome completo"
                  />
                  {errors.ownerName && (
                    <p className="text-sm text-destructive">{errors.ownerName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9"
                    />
                  </div>
                  {errors.ownerEmail && (
                    <div className="space-y-1">
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.ownerEmail}
                      </p>
                      {errors.ownerEmail?.includes("já está cadastrado") && (
                        <Link 
                          href="/login" 
                          className="text-sm text-primary underline hover:text-primary/80 inline-block"
                        >
                          Fazer login com esta conta →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerPassword">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerPassword"
                      type="password"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-9"
                    />
                  </div>
                  {errors.ownerPassword && (
                    <p className="text-sm text-destructive">{errors.ownerPassword}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerPasswordConfirm">Confirmar senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerPasswordConfirm"
                      type="password"
                      value={ownerPasswordConfirm}
                      onChange={(e) => setOwnerPasswordConfirm(e.target.value)}
                      placeholder="Digite a senha novamente"
                      className="pl-9"
                    />
                  </div>
                  {errors.ownerPasswordConfirm && (
                    <p className="text-sm text-destructive">
                      {errors.ownerPasswordConfirm}
                    </p>
                  )}
                </div>
                
                <Button type="button" onClick={handleNextStep} className="w-full">
                  Continuar
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Faça login
                  </Link>
                </p>
              </div>
            )}
            
            {/* PASSO 2: Dados do Salão */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Briefcase className="h-5 w-5" />
                  <span>Dados do Salão</span>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonName">Nome do salão *</Label>
                  <Input
                    id="salonName"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    placeholder="Nome fantasia do seu salão"
                  />
                  {errors.salonName && (
                    <p className="text-sm text-destructive">{errors.salonName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonPhone">Telefone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="salonPhone"
                      value={salonPhone}
                      onChange={(e) => setSalonPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="pl-9"
                    />
                  </div>
                  {errors.salonPhone && (
                    <p className="text-sm text-destructive">{errors.salonPhone}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonZipCode">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="salonZipCode"
                      value={salonZipCode}
                      onChange={(e) => setSalonZipCode(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCepSearch}
                      disabled={loadingCep || salonZipCode.length < 8}
                      className="gap-2"
                    >
                      {loadingCep ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Buscar
                    </Button>
                  </div>
                  {errors.salonZipCode && (
                    <p className="text-sm text-destructive">{errors.salonZipCode}</p>
                  )}
                  {loadingCep && (
                    <p className="text-sm text-muted-foreground">Buscando CEP...</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonAddress">Logradouro (Rua/Avenida) *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="salonAddress"
                      value={salonAddress}
                      onChange={(e) => setSalonAddress(e.target.value)}
                      placeholder="Ex: Rua das Flores"
                      className="pl-9"
                    />
                  </div>
                  {errors.salonAddress && (
                    <p className="text-sm text-destructive">{errors.salonAddress}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonNumber">Número *</Label>
                  <Input
                    id="salonNumber"
                    value={salonNumber}
                    onChange={(e) => setSalonNumber(e.target.value)}
                    placeholder="Ex: 123"
                  />
                  {errors.salonNumber && (
                    <p className="text-sm text-destructive">{errors.salonNumber}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salonCity">Cidade *</Label>
                    <Input
                      id="salonCity"
                      value={salonCity}
                      onChange={(e) => setSalonCity(e.target.value)}
                      placeholder="Cidade"
                    />
                    {errors.salonCity && (
                      <p className="text-sm text-destructive">{errors.salonCity}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="salonState">Estado *</Label>
                    <select
                      id="salonState"
                      value={salonState}
                      onChange={(e) => setSalonState(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Selecione...</option>
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                    {errors.salonState && (
                      <p className="text-sm text-destructive">{errors.salonState}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonZipCode">CEP</Label>
                  <Input
                    id="salonZipCode"
                    value={salonZipCode}
                    onChange={(e) => setSalonZipCode(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="salonDescription">Descrição (opcional)</Label>
                  <Textarea
                    id="salonDescription"
                    value={salonDescription}
                    onChange={(e) => setSalonDescription(e.target.value)}
                    placeholder="Conte um pouco sobre seu salão..."
                    rows={4}
                  />
                </div>
                
                {errors.submit && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">{errors.submit}</p>
                        {errors.submit?.includes("email já está cadastrado") && (
                          <Link 
                            href="/login" 
                            className="text-sm text-destructive underline hover:text-destructive/80 mt-1 inline-block"
                          >
                            Fazer login com esta conta →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep(1);
                      setErrors({});
                    }}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      "Criar Cadastro"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
        
        {/* Benefícios */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Agendamentos Online</h3>
            <p className="text-sm text-muted-foreground">
              Receba agendamentos 24/7
            </p>
          </Card>
          
          <Card className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Mais Clientes</h3>
            <p className="text-sm text-muted-foreground">
              Seja descoberto por novos clientes
            </p>
          </Card>
          
          <Card className="p-4 text-center space-y-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Gestão Completa</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie serviços e profissionais
            </p>
          </Card>
        </div>
      </div>
    </GridBackground>
  );
}
