"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { GradientButton } from "@/components/ui/gradient-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { GridBackground } from "@/components/ui/grid-background"
import { ArrowLeft, Save, Sparkles, Package } from "lucide-react"
import Link from "next/link"

export default function NewServicePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [salons, setSalons] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "30",
    price: "",
    category: "",
    salonId: "",
  })

  // Carregar salões e profissionais
  useEffect(() => {
    fetchSalons()
    fetchStaff()
  }, [])

  const fetchSalons = async () => {
    try {
      const response = await fetch("/api/salons")
      if (response.ok) {
        const data = await response.json()
        setSalons(data)
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, salonId: data[0].id }))
        }
      }
    } catch (error) {
      console.error("Erro ao carregar salões:", error)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/staff")
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const toggleStaff = (staffId: string) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          staffIds: selectedStaff
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar serviço")
      }

      router.push("/dashboard/servicos")
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={{ name: "Admin", email: "admin@example.com", role: "ADMIN" }} />
      
      <GridBackground>
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <Link href="/dashboard/servicos">
              <GradientButton variant="primary" className="mb-4 px-4 py-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </GradientButton>
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Novo Serviço
            </h1>
            <p className="text-foreground-muted">
              Adicione um novo serviço ao seu salão
            </p>
          </div>

          {/* Formulário */}
          <GlassCard glow="primary" className="p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Informações do Serviço
              </h2>
              <p className="text-foreground-muted mt-1">
                Preencha os dados do serviço
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome do Serviço *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Corte Masculino"
                  required
                  disabled={isLoading}
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">Descrição</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva o serviço..."
                  className="flex min-h-[80px] w-full rounded-lg glass-card bg-background-alt/50 border-primary/20 px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-foreground">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-foreground">Preço (R$) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    required
                    disabled={isLoading}
                    className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">Categoria</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Ex: Corte, Barba, Coloração"
                  disabled={isLoading}
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                />
              </div>

              {salons.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="salonId" className="text-foreground">Salão *</Label>
                  <select
                    id="salonId"
                    name="salonId"
                    value={formData.salonId}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-lg glass-card bg-background-alt/50 border-primary/20 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    disabled={isLoading}
                  >
                    {salons.map((salon) => (
                      <option key={salon.id} value={salon.id}>
                        {salon.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {staff.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">Profissionais</Label>
                  <p className="text-xs text-foreground-muted mb-2">
                    Selecione os profissionais que prestam este serviço
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto glass-card border-primary/20 rounded-lg p-3">
                    {staff.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-primary/10 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStaff.includes(s.id)}
                          onChange={() => toggleStaff(s.id)}
                          className="rounded border-primary/30 text-primary focus:ring-primary"
                          disabled={isLoading}
                        />
                        <span className="text-sm text-foreground">{s.name}</span>
                        {s.specialty && (
                          <span className="text-xs text-foreground-muted">- {s.specialty}</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <GradientButton
                  type="submit"
                  variant="accent"
                  disabled={isLoading}
                  className="flex-1 py-3"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? "Salvando..." : "Salvar Serviço"}
                </GradientButton>
                <Link href="/dashboard/servicos">
                  <GradientButton 
                    type="button" 
                    variant="primary" 
                    disabled={isLoading}
                    className="py-3"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Cancelar
                  </GradientButton>
                </Link>
              </div>
            </form>
          </GlassCard>
        </main>
      </GridBackground>
    </div>
  )
}
