# 🔧 Guia Técnico - Próximas Implementações

## 📋 Checklist de Desenvolvimento

### 1. Sistema de Autenticação (NextAuth)

#### Arquivos a Criar:
```
app/api/auth/[...nextauth]/route.ts  # API route do NextAuth
app/login/page.tsx                    # Página de login
app/register/page.tsx                 # Página de cadastro
lib/auth.ts                           # Configurações do NextAuth
middleware.ts                         # Proteção de rotas
```

#### Exemplo de Configuração:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user) return null
        
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  }
})

export { handler as GET, handler as POST }
```

### 2. Dashboard Administrativo

#### Estrutura de Páginas:
```
app/dashboard/
├── page.tsx                 # Dashboard principal
├── layout.tsx               # Layout do dashboard
├── agendamentos/
│   ├── page.tsx            # Lista de agendamentos
│   └── [id]/page.tsx       # Detalhes do agendamento
├── clientes/
│   ├── page.tsx            # Lista de clientes
│   └── [id]/page.tsx       # Perfil do cliente
├── servicos/
│   ├── page.tsx            # Lista de serviços
│   ├── novo/page.tsx       # Criar serviço
│   └── [id]/edit/page.tsx  # Editar serviço
├── profissionais/
│   ├── page.tsx            # Lista de profissionais
│   ├── novo/page.tsx       # Cadastrar profissional
│   └── [id]/edit/page.tsx  # Editar profissional
└── configuracoes/
    └── page.tsx            # Configurações do salão
```

#### Componentes Necessários:
```
components/
├── dashboard/
│   ├── Sidebar.tsx         # Menu lateral
│   ├── Header.tsx          # Cabeçalho
│   ├── StatsCard.tsx       # Cards de estatísticas
│   └── RecentBookings.tsx  # Agendamentos recentes
└── forms/
    ├── ServiceForm.tsx     # Formulário de serviço
    ├── StaffForm.tsx       # Formulário de profissional
    └── BookingForm.tsx     # Formulário de agendamento
```

### 3. Sistema de Agendamento (Cliente)

#### Fluxo de Agendamento:
1. Selecionar Salão
2. Escolher Serviço
3. Selecionar Profissional
4. Escolher Data e Horário
5. Confirmar e Pagar (opcional)

#### Arquivos:
```
app/agendar/
├── page.tsx                # Lista de salões
├── [salonId]/
│   ├── page.tsx           # Detalhes do salão
│   ├── servicos/
│   │   └── page.tsx       # Escolher serviço
│   └── confirmar/
│       └── page.tsx       # Confirmar agendamento
```

#### Componente de Calendário:
```typescript
// components/booking/Calendar.tsx
import { useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Calendar({ onSelectDate, availableDates }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Lógica do calendário...
  
  return (
    <div className="calendar">
      {/* UI do calendário */}
    </div>
  )
}
```

### 4. API Routes Necessárias

```
app/api/
├── salons/
│   ├── route.ts            # GET, POST salons
│   └── [id]/route.ts       # GET, PUT, DELETE salon
├── services/
│   ├── route.ts            # GET, POST services
│   └── [id]/route.ts       # GET, PUT, DELETE service
├── staff/
│   ├── route.ts            # GET, POST staff
│   └── [id]/route.ts       # GET, PUT, DELETE staff member
├── bookings/
│   ├── route.ts            # GET, POST bookings
│   ├── [id]/route.ts       # GET, PUT, DELETE booking
│   └── available/route.ts  # GET horários disponíveis
└── users/
    ├── route.ts            # GET, POST users
    └── [id]/route.ts       # GET, PUT, DELETE user
```

#### Exemplo de API:
```typescript
// app/api/bookings/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const bookings = await prisma.booking.findMany({
    where: { clientId: session.user.id },
    include: {
      salon: true,
      service: true,
      staff: true
    },
    orderBy: { date: 'desc' }
  })
  
  return NextResponse.json(bookings)
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const data = await request.json()
  
  const booking = await prisma.booking.create({
    data: {
      date: new Date(data.date),
      clientId: session.user.id,
      salonId: data.salonId,
      serviceId: data.serviceId,
      staffId: data.staffId,
      totalPrice: data.totalPrice,
      status: 'PENDING'
    }
  })
  
  return NextResponse.json(booking, { status: 201 })
}
```

### 5. Validação com Zod

```typescript
// lib/validations.ts
import { z } from 'zod'

export const bookingSchema = z.object({
  date: z.string().datetime(),
  salonId: z.string().cuid(),
  serviceId: z.string().cuid(),
  staffId: z.string().cuid(),
  notes: z.string().optional()
})

export const serviceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  duration: z.number().min(15, 'Duração mínima de 15 minutos'),
  price: z.number().positive('Preço deve ser positivo'),
  category: z.string().optional()
})

export const staffSchema = z.object({
  name: z.string().min(3),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialty: z.string().optional()
})
```

### 6. Hooks Personalizados

```typescript
// hooks/useBookings.ts
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useBookings() {
  const { data, error, mutate } = useSWR('/api/bookings', fetcher)
  
  return {
    bookings: data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}

// hooks/useServices.ts
export function useServices(salonId?: string) {
  const url = salonId ? `/api/services?salonId=${salonId}` : '/api/services'
  const { data, error } = useSWR(url, fetcher)
  
  return {
    services: data,
    isLoading: !error && !data,
    isError: error
  }
}
```

### 7. Componentes UI Adicionais Necessários

```typescript
// components/ui/input.tsx
export function Input({ ...props }) { }

// components/ui/select.tsx
export function Select({ ...props }) { }

// components/ui/textarea.tsx
export function Textarea({ ...props }) { }

// components/ui/dialog.tsx
export function Dialog({ ...props }) { }

// components/ui/toast.tsx
export function Toast({ ...props }) { }

// components/ui/calendar.tsx
export function Calendar({ ...props }) { }
```

### 8. Testes

```typescript
// __tests__/api/bookings.test.ts
import { POST } from '@/app/api/bookings/route'

describe('Bookings API', () => {
  it('should create a booking', async () => {
    const response = await POST({
      json: async () => ({
        date: '2025-11-15T10:00:00Z',
        salonId: 'salon-id',
        serviceId: 'service-id',
        staffId: 'staff-id',
        totalPrice: 50.0
      })
    })
    
    expect(response.status).toBe(201)
  })
})
```

## 🚀 Ordem Recomendada de Implementação

1. ✅ Setup inicial e Landing Page
2. ✅ Banco de dados com Prisma
3. 🔄 Sistema de Autenticação (NextAuth)
4. 🔄 CRUD de Serviços
5. 🔄 CRUD de Profissionais
6. 🔄 Sistema de Agendamento (lógica de horários)
7. 🔄 Dashboard Administrativo
8. 🔄 Página de Agendamento do Cliente
9. ⏳ Notificações (Email/SMS)
10. ⏳ Sistema de Pagamento
11. ⏳ Relatórios e Analytics
12. ⏳ App Mobile (PWA)

## 📚 Recursos Úteis

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Última atualização**: 02/11/2025
