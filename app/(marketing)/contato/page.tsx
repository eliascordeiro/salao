"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Mail, Send, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "TECNICO", label: "Suporte Técnico" },
  { value: "FATURAMENTO", label: "Faturamento" },
  { value: "DUVIDA", label: "Dúvida" },
  { value: "SUGESTAO", label: "Sugestão" },
  { value: "RECLAMACAO", label: "Reclamação" },
];

export default function ContatoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    subject: "",
    category: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar ticket");
      }

      const ticket = await response.json();
      
      setSuccess(true);
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        if (session?.user?.role === "ADMIN") {
          router.push("/dashboard/suporte");
        } else {
          router.push("/");
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // WhatsApp link
  const whatsappNumber = "5511999999999"; // SUBSTITUIR pelo número real
  const whatsappMessage = encodeURIComponent(
    `Olá! Preciso de ajuda com: ${formData.subject || "atendimento"}`
  );
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-12 pb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ticket Criado!</h2>
            <p className="text-muted-foreground mb-4">
              Recebemos sua mensagem e entraremos em contato em breve.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecionando...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Entre em Contato</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Estamos aqui para ajudar! Escolha o canal de sua preferência ou preencha o formulário abaixo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Opções de Contato Rápido */}
          <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.open(whatsappLink, "_blank")}>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Resposta em até 2h
              </p>
              <Button variant="outline" className="w-full">
                Abrir WhatsApp
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Mail className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-sm text-muted-foreground mb-4">
                suporte@agendasalao.com.br
              </p>
              <Button variant="outline" className="w-full"
                      onClick={() => window.location.href = "mailto:suporte@agendasalao.com.br"}>
                Enviar Email
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Formulário */}
        <Card className="glass-card max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Abrir Ticket de Suporte</CardTitle>
            <CardDescription>
              Preencha o formulário abaixo e retornaremos o mais breve possível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  placeholder="Resuma o problema em poucas palavras"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Descreva seu problema ou dúvida em detalhes..."
                  rows={6}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Horário de Atendimento */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p> WhatsApp disponível 24/7</p>
        </div>
      </div>
    </div>
  );
}
