# Sistema de Agendamento para Salões & Barbearias

## Status do Projeto
- [x] Criar estrutura do projeto Next.js
- [x] Configurar banco de dados (Prisma + SQLite)
- [x] Criar página inicial (landing page)
- [x] Sistema de autenticação (NextAuth.js)
- [x] CRUD completo de Serviços
- [x] CRUD completo de Profissionais
- [x] Gestão de Agendamentos (Admin)
- [x] Interface de agendamento do cliente
- [x] Sistema de notificações por email
- [x] Relatórios e dashboard avançado
- [x] Sistema de pagamentos
- [x] Sistema de horários dos profissionais
- [x] Sistema de gestão de disponibilidade (bloqueios)
- [x] Validação de conflito de horário do cliente
- [x] Sistema multi-tenant (salão por usuário)
- [x] Associação de profissionais aos serviços
- [x] Padronização de inputs com glass-card
- [x] Simplificação para slots apenas (removido agendamento dinâmico)
- [x] Sistema de contas a pagar (controle de despesas)
- [x] Swipeable Date Picker (carrossel de datas)
- [x] Lazy Loading de salões (Infinite Scroll)
- [x] Adicionar ao Calendário (.ics export)
- [x] Integração com Mapbox (mapas e geolocalização)
- [x] Sistema de Favoritos (localStorage)
- [x] Bottom Sheet de Resumo flutuante
- [x] Sistema de despesas recorrentes (auto-criação)
- [x] Relatórios financeiros avançados (lucro, despesas por categoria)
- [x] Sistema de permissões multi-usuário
- [x] Chat com IA (Groq + Llama 3.3 70B)
- [x] Sistema de Suporte (tickets + FAQ + multi-canal)
- [x] Sistema de seleção de serviços no caixa (checkboxes para pagamento parcial)
- [x] Assistente Virtual Admin (IA contextual no painel administrativo)
- [x] Sistema de Assinaturas com Mercado Pago (PIX + Cartão)

## Stack Tecnológico
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM (v5.0.0)
- NextAuth.js
- Stripe (v17.4.0) - Pagamentos dos agendamentos
- @stripe/stripe-js - Cliente Stripe
- Mercado Pago SDK (v2.0.11) - Assinaturas mensais
- shadcn/ui
- Lucide React (ícones)
- Recharts (gráficos e visualizações)
- date-fns (manipulação de datas)
- Groq SDK (IA conversacional)
- Radix UI (componentes acessíveis)

## Estrutura do Banco de Dados
- User (clientes e admins)
- Salon (salões/barbearias)
- Staff (profissionais)
- Service (serviços)
- Booking (agendamentos)
- ServiceStaff (relação N:N)
- Payment (pagamentos dos agendamentos via Stripe)
- Transaction (transações)
- Availability (bloqueios de horários)
- Expense (despesas/contas a pagar)
- SupportTicket (tickets de suporte)
- TicketMessage (mensagens dos tickets)
- Plan (planos de assinatura - Essencial/Profissional)
- Subscription (assinaturas mensais via Mercado Pago)
- SubscriptionPayment (histórico de pagamentos das assinaturas)

## Funcionalidades Implementadas
✅ Landing page responsiva
✅ Sistema de login/registro
✅ Dashboard básico com estatísticas
✅ Proteção de rotas com middleware
✅ Gestão de sessões com JWT
✅ CRUD completo de Serviços (listar, criar, editar, deletar)
✅ CRUD completo de Profissionais (listar, criar, editar, deletar)
✅ Associação de profissionais aos serviços (N:N via ServiceStaff):
  - Seleção múltipla de serviços no cadastro/edição
  - Interface com checkboxes estilizados (glass-card)
  - Exibe duração e preço de cada serviço
  - Badges de serviços na listagem de profissionais
  - API suporta criação e atualização de associações
✅ Status ativo/inativo para serviços e profissionais
✅ Gestão de Agendamentos (Admin) - listar, filtrar, alterar status
✅ Interface de agendamento do cliente:
  - Catálogo de serviços com busca e filtros
  - Fluxo de agendamento em 4 etapas (serviço → profissional → data/hora → confirmação)
  - Página "Meus Agendamentos" com filtros (próximos/anteriores/cancelados)
  - Sistema de horários disponíveis (evita conflitos)
  - Cancelamento de agendamentos pelo cliente
  - Validação de conflito de horário (impede cliente agendar dois serviços no mesmo horário)
✅ Sistema de Notificações por Email:
  - Email ao criar agendamento (status PENDING)
  - Email ao confirmar agendamento
  - Email ao cancelar agendamento
  - Lembretes automáticos 24h antes
  - Templates HTML responsivos
  - Registro de histórico no banco (model Notification)
  - API para envio de lembretes manuais/automáticos
✅ Sistema de Relatórios e Analytics:
  - 4 APIs de analytics (stats, bookings-over-time, popular-services, revenue-by-period)
  - 4 componentes de gráficos (Linha, Barras, Pizza, Área)
  - Página de relatórios com seletor de período (7d/30d/3m/1y)
  - Cards de métricas principais (agendamentos, receita, taxas)
  - Indicadores de crescimento vs período anterior
  - Análise de serviços mais populares
  - Distribuição de status dos agendamentos
  - Análise temporal de receita (dia/semana/mês)
  - Exportação de relatórios em CSV (4 tipos: agendamentos, receita, serviços, completo)
  - Dashboard melhorado com métricas dos últimos 30 dias
  - Comparação automática com período anterior
  - Top profissional do mês
  - Ações rápidas para navegação
✅ Sistema de Pagamentos Online:
  - Integração completa com Stripe
  - Checkout hospedado seguro (Stripe Checkout)
  - Suporte a cartões de crédito/débito
  - Confirmação automática via webhooks (4 eventos)
  - Páginas de sucesso e cancelamento
  - Botão de pagamento em "Meus Agendamentos"
  - Página de checkout com resumo do agendamento
  - Componentes reutilizáveis (CheckoutButton, PaymentStatus)
  - Painel administrativo de pagamentos
  - Estatísticas de receita e taxas de sucesso
  - Histórico completo de transações
✅ Sistema de Horários dos Profissionais:
  - Configuração personalizada por profissional
  - Seleção de dias de trabalho (Dom-Sáb)
  - Horário de início e término do expediente
  - Horário de almoço configurável (opcional)
  - Validação de formato e lógica de horários
  - Integração com sistema de slots disponíveis
  - Interface amigável com card de resumo
  - API PATCH para atualização de horários
  - Botão "Horários" na lista de profissionais
  - Geração dinâmica de slots baseada em horários reais
  - Exclusão automática de slots no horário de almoço
  - Verificação de dias de trabalho do profissional
  - Email de confirmação de pagamento
  - Suporte a reembolsos (estrutura preparada)
  - Models: Payment (6 status) e Transaction
  - Documentação completa (SISTEMA_PAGAMENTOS.md)
✅ Correção de Bug de Timezone:
  - Uso de UTC para armazenamento e cálculo
  - setUTCHours() e getUTCHours() para consistência
  - Grade de horários mostra slots ocupados corretamente (vermelho 🔴)
  - Sistema respeita intervalos gravados no banco
✅ Validação de Conflito de Horário do Cliente:
  - Impede cliente agendar dois serviços no mesmo horário
  - Verifica conflitos mesmo com profissionais diferentes
  - Detecta sobreposições parciais e totais
  - Alerta detalhado com informações do agendamento conflitante
  - Funciona em ambos os modos (dinâmico e slots)
✅ Sistema multi-tenant (salão por usuário):
  - Helpers para obter salão do usuário logado (lib/salon-helper.ts)
  - APIs auto-filtram por salão (staff, services, bookings)
  - Página de gestão do salão (/dashboard/meu-salao)
  - Remoção de seletores manuais de salão nos CRUDs
  - Documentação completa (docs/SISTEMA_MULTI_TENANT.md)
✅ Padronização de UI com glass-card:
  - Componente Input base atualizado
  - Cores do tema (bg-background-alt/50, border-primary/20)
  - Suporte completo a dark/light theme
  - Documentação de padrões (docs/PADROES_UI.md)
✅ Simplificação do Sistema de Agendamento:
  - Sistema agora usa APENAS horários pré-definidos (slots)
  - Removida opção de agendamento dinâmico da UI
  - Página de configuração simplificada (apenas informativa)
  - Cliente sempre redirecionado para /agendar-slots
  - Experiência mais direta e simples
  - Documentação completa (docs/SIMPLIFICACAO_SLOTS.md)
✅ Sistema de Contas a Pagar (Despesas):
  - CRUD completo de despesas (criar, listar, editar, deletar)
  - 8 categorias de despesas (Aluguel, Utilidades, Produtos, Salários, etc.)
  - 3 status (Pendente, Pago, Atrasado)
  - 5 métodos de pagamento (Dinheiro, Débito, Crédito, PIX, Transferência)
  - Filtros avançados (busca, status, categoria, período)
  - Dashboard card com resumo de despesas e cálculo de lucro
  - Suporte a despesas recorrentes (estrutura preparada)
  - Multi-tenant com isolamento por salão
  - Helper functions para cálculo de lucro e análises
  - Documentação completa (docs/CONTAS_A_PAGAR.md)
✅ Swipeable Date Picker (Carrossel de Datas):
  - Componente DateCarousel com navegação por swipe
  - Scroll suave e responsivo
  - Indicadores visuais de data selecionada
  - Integrado no fluxo de agendamento
✅ Lazy Loading de Salões (Infinite Scroll):
  - Carregamento progressivo de salões
  - Intersection Observer API
  - Loading skeleton durante fetch
  - Melhor performance e UX
✅ Adicionar ao Calendário:
  - Exportação de agendamentos em formato .ics
  - Compatível com Google Calendar, Outlook, Apple Calendar
  - Inclui todos os detalhes: serviço, profissional, endereço, telefone
✅ Integração com Mapbox:
  - Mapas interativos com Mapbox GL JS
  - Componente SalonMap (mapa individual)
  - Componente SalonsMapView (múltiplos salões)
  - Botão DirectionsButton (navegação inteligente)
  - Toggle List/Map view na lista de salões
  - Geolocalização e cálculo de distância
  - GPS coordinates no banco de dados
  - Deployed to Railway
✅ Sistema de Favoritos:
  - Hook useFavorites para gerenciar com localStorage
  - Componente FavoriteButton com animação de coração
  - Botão nos cards de salão (canto superior esquerdo)
  - Página /favoritos para listar salões favoritos
  - Link 'Meus Favoritos' no menu do cliente
  - Persistência local sem necessidade de login
  - Estados vazios com call-to-action
✅ Bottom Sheet de Resumo Flutuante:
  - Componente FloatingBookingSummary
  - Resumo do agendamento: serviço, profissional, data, hora, preço
  - Bottom sheet fixo na parte inferior (mobile)
  - Colapsa/expande com animação suave
  - Backdrop blur quando expandido
  - Botão 'Continuar' sempre visível
  - Responsivo: bottom sheet mobile, card sticky desktop
  - Atualização dinâmica conforme seleções
✅ Sistema de Despesas Recorrentes:
  - Campos no schema: isRecurring, recurrence, recurringDay, lastGenerated
  - Serviço processRecurringExpenses para auto-geração
  - API /api/cron/recurring-expenses (protegida com Bearer token)
  - Frequências suportadas: MONTHLY, WEEKLY, YEARLY
  - Cálculo automático de recurringDay
  - UI atualizada com checkbox de recorrência
  - Documentação completa do cron job
✅ Relatórios Financeiros Avançados:
  - API /api/analytics/financial com métricas completas
  - Página /dashboard/financeiro com visualizações
  - Cards de resumo: Receita, Despesas, Lucro, Margem
  - Gráfico de evolução mensal (Receita vs Despesas vs Lucro)
  - Gráfico de despesas por categoria (pizza chart)
  - Tabela de top categorias com porcentagens
  - Indicadores de tendência com growth arrows
  - Seletor de período (3m, 6m, 12m)
  - Cálculo de médias mensais e comparações
  - Integração com Recharts para visualizações
✅ Sistema de Permissões Multi-Usuário:
  - Schema User com roleType (OWNER/STAFF/CUSTOM), ownerId, permissions[]
  - 33 permissões definidas em 10 módulos (lib/permissions.ts)
  - PERMISSION_GROUPS para organização na UI
  - Página /dashboard/usuarios para gestão
  - Formulário de criação com seletor de permissões por módulo
  - APIs completas: criar, listar, editar, desativar, reenviar convite
  - Sistema de convite por email com senha temporária
  - Hook usePermissions para verificações no frontend
  - Componente ProtectedFeature para renderização condicional
  - Sidebar filtra itens baseado em permissões
  - Session estendida com permissions e roleType
  - Validação de usuário ativo no login
  - Self-referential User model (owner → managedUsers)
  - Permissões incluem: dashboard, salão, agendamentos, profissionais, serviços, caixa, despesas, financeiro, usuários, configurações
✅ Sistema de Email Centralizado:
  - API /api/email/send para envio via SMTP
  - Suporte a múltiplos provedores (Gmail, SendGrid, Mailtrap, AWS SES)
  - Página /dashboard/configuracoes/email para configuração e teste
  - Validação automática de configuração SMTP
  - Templates HTML responsivos
  - Integração com sistema de usuários (convites automáticos)
  - Variáveis: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
  - Logs detalhados de envio
  - Interface de teste com feedback visual
  - Documentação completa (docs/SISTEMA_EMAIL.md)
✅ Chat com IA (Assistente Virtual):
  - Integração com Groq AI (Llama 3.3 70B)
  - Widget flutuante em páginas de salão
  - Contexto dinâmico com dados do salão (serviços, profissionais, horários)
  - Respostas naturais em português
  - Sistema de mensagens com histórico
  - Gratuito (14.400 requests/dia)
  - API: /api/chat
  - Componente: AIChatWidget
  - Documentação: docs/SISTEMA_CHAT_IA.md
✅ Sistema de Suporte Completo:
  - Sistema de tickets com categorização (5 categorias)
  - Status tracking (Aberto, Em Andamento, Resolvido, Fechado)
  - Prioridades (Baixa, Média, Alta, Urgente)
  - Painel administrativo (/dashboard/suporte)
  - Página de contato (/contato) com múltiplos canais
  - Central de ajuda (/ajuda) com 50+ FAQs
  - Sistema de mensagens (conversação)
  - Filtros avançados e busca
  - Integração WhatsApp, Email, Telefone
  - Models: SupportTicket, TicketMessage
  - APIs REST completas (CRUD + messages)
  - Interface de resposta rápida
  - Estatísticas de atendimento
  - Documentação: docs/SISTEMA_SUPORTE.md
  - Permissões incluem: dashboard, salão, agendamentos, profissionais, serviços, caixa, despesas, financeiro, usuários, configurações
✅ Sistema de Email Centralizado:
  - API /api/email/send para envio via SMTP
  - Suporte a múltiplos provedores (Gmail, SendGrid, Mailtrap, AWS SES)
  - Página /dashboard/configuracoes/email para configuração e teste
  - Validação automática de configuração SMTP
  - Templates HTML responsivos
  - Integração com sistema de usuários (convites automáticos)
  - Variáveis: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
  - Logs detalhados de envio
  - Interface de teste com feedback visual
  - Documentação completa (docs/SISTEMA_EMAIL.md)
✅ Sistema de Seleção de Serviços no Caixa:
  - Checkboxes ao lado de cada serviço no modal de pagamento
  - Todos os serviços selecionados por padrão (default "sim")
  - Toggle individual de serviços
  - Botões "Todos" e "Nenhum" para seleção rápida
  - Cálculo dinâmico de subtotal baseado em seleção
  - Contador de serviços selecionados (X de Y)
  - Feedback visual: borda colorida + ícone check
  - Validação: impede confirmação sem serviços selecionados
  - Desconto limitado ao subtotal dos serviços selecionados
  - Suporte a pagamentos parciais (pagar alguns agora, outros depois)
  - Componente Checkbox (Radix UI + Lucide)
  - Performance otimizada com Set<string>
  - Documentação: docs/SISTEMA_SELECAO_SERVICOS_CAIXA.md
  - ✅ Backend implementado: API suporta pagamentos parciais completos
✅ Assistente Virtual Admin (IA contextual):
  - Componente AdminAIChatWidget (components/chat/admin-ai-chat-widget.tsx)
  - API /api/chat/admin com contexto da página atual
  - Detecção automática de página via usePathname()
  - Sugestões contextuais ao navegar (8 páginas: caixa, agendamentos, profissionais, etc)
  - Perguntas rápidas para tarefas comuns
  - Gradiente azul/índigo (diferenciado do cliente: rosa/roxo)
  - Groq AI (Llama 3.3 70B) com prompts admin-específicos
  - Disponível globalmente em todo painel admin
  - System prompt com 10 módulos do sistema
  - Documentação completa: docs/ASSISTENTE_VIRTUAL_ADMIN.md
✅ Sistema de Assinaturas com Mercado Pago (70% completo):
  - Planos: Essencial (R$49/mês) e Profissional (R$149/mês)
  - Pagamento via PIX (0% taxa) e Cartão de Crédito (4.99% + R$0.40)
  - Trial gratuito de 14 dias em todos os planos
  - Models: Plan, Subscription, SubscriptionPayment
  - APIs: /api/plans, /api/subscriptions/create-preference, /api/subscriptions/webhook, /api/subscriptions/status
  - Páginas: /planos (pública), /checkout (seleção PIX/Cartão)
  - Páginas de retorno: /dashboard/assinatura/sucesso, /dashboard/assinatura/erro, /dashboard/assinatura/pendente
  - Checkout hospedado no Mercado Pago (seguro e PCI compliant)
  - Webhook para confirmação automática de pagamentos
  - Credenciais TEST configuradas no .env
  - Documentação completa: docs/SISTEMA_ASSINATURAS_MERCADOPAGO.md
  - Guia de testes: docs/GUIA_TESTES_ASSINATURAS.md
  - ⏳ Falta implementar: Feature flags para bloquear recursos premium + Dashboard admin de assinatura

## Credenciais de Teste
- Admin: admin@agendasalao.com.br / admin123
- Cliente: pedro@exemplo.com / cliente123
- Cartão de teste Stripe (agendamentos): 4242 4242 4242 4242
- Cartão de teste Mercado Pago (assinaturas):
  - Aprovado: 5031 4332 1540 6351 (CVV: 123, Exp: 11/25)
  - Rejeitado: 5031 4332 1540 5814 (CVV: 123, Exp: 11/25)

## Próximos Passos
1. ✅ ~~Sistema de autenticação~~ COMPLETO
2. ✅ ~~CRUD de Serviços~~ COMPLETO
3. ✅ ~~CRUD de Profissionais~~ COMPLETO
4. ✅ ~~Gestão de Agendamentos (Admin)~~ COMPLETO
5. ✅ ~~Interface de agendamento do cliente~~ COMPLETO
6. ✅ ~~Sistema de notificações por email~~ COMPLETO
7. ✅ ~~Relatórios e dashboard avançado~~ COMPLETO
8. ✅ ~~Sistema de pagamentos online (Stripe)~~ COMPLETO
9. ✅ ~~Sistema de horários dos profissionais~~ COMPLETO
10. ✅ ~~Sistema multi-tenant~~ COMPLETO
11. ✅ ~~Associação profissional ↔ serviços~~ COMPLETO
12. ✅ ~~Padronização de UI (glass-card)~~ COMPLETO
13. ✅ ~~Sistema de contas a pagar~~ COMPLETO
14. ✅ ~~Swipeable Date Picker~~ COMPLETO
15. ✅ ~~Lazy Loading de salões~~ COMPLETO
16. ✅ ~~Adicionar ao Calendário (.ics)~~ COMPLETO
17. ✅ ~~Integração com Mapbox~~ COMPLETO
18. ✅ ~~Sistema de Favoritos~~ COMPLETO
19. ✅ ~~Bottom Sheet de Resumo~~ COMPLETO
20. ✅ ~~Sistema de despesas recorrentes~~ COMPLETO
21. ✅ ~~Relatórios financeiros avançados~~ COMPLETO
22. ✅ ~~Sistema de permissões multi-usuário~~ COMPLETO
23. ✅ ~~Sistema de assinaturas (Mercado Pago)~~ 70% COMPLETO
24. Feature flags para bloquear recursos premium
25. Dashboard de gerenciamento de assinatura (admin)
26. Sistema de reembolsos (admin)
27. Notificações SMS (opcional)
28. App mobile (opcional)

## Observações Técnicas
- Node.js 18.17.0+ necessário
- NextAuth.js 4.24.5 configurado
- Stripe 17.4.0 configurado (pagamentos de agendamentos)
- Mercado Pago SDK 2.0.11 configurado (assinaturas mensais)
- PostgreSQL configurado e funcional
- Middleware protegendo rotas /dashboard
- Componentes UI: Button, Card, Input, Label
