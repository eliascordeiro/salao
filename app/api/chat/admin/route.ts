import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages são obrigatórias" },
        { status: 400 }
      );
    }

    // Contexto do sistema para o assistente admin
    const systemPrompt = `Você é um assistente virtual especializado em ajudar administradores de salões e barbearias a usar o sistema AgendaSalão.

CONTEXTO ATUAL:
- Página: ${context?.page || "dashboard"}
- Caminho: ${context?.fullPath || "/dashboard"}
- Perfil: ${context?.userRole || "OWNER"}

FUNCIONALIDADES DO SISTEMA:

DASHBOARD:
- Visão geral de métricas (agendamentos, receita, taxa de ocupação)
- Comparação com período anterior
- Top profissional do mês
- Ações rápidas

CAIXA:
- Gerenciamento de pagamentos pendentes
- Sistema de checkboxes para pagamento parcial
- Aplicação de descontos
- Métodos: Dinheiro, Cartão, PIX, Múltiplos
- Histórico de pagamentos
- Sessões OPEN (pendentes) e CLOSED (pagas)

AGENDAMENTOS:
- Listagem com filtros por status, profissional, data
- Status: PENDING, CONFIRMED, COMPLETED, CANCELLED
- Confirmação e cancelamento
- Sistema de notificações por email
- Validação de conflitos de horário

PROFISSIONAIS:
- CRUD completo
- Configuração de horários de trabalho (dias, início, fim, almoço)
- Associação com serviços (N:N)
- Status ativo/inativo
- Especialidades

SERVIÇOS:
- Gestão de serviços oferecidos
- Preço, duração, descrição
- Status ativo/inativo
- Associação com profissionais

RELATÓRIOS E FINANCEIRO:
- Analytics avançado (receita, agendamentos ao longo do tempo)
- Gráficos de linha, barras, pizza, área
- Exportação para CSV
- Análise de lucro vs despesas
- Despesas por categoria
- Margem de lucro

CONTAS A PAGAR (Despesas):
- 8 categorias (Aluguel, Utilidades, Produtos, Salários, Marketing, Manutenção, Taxas, Outros)
- Status: Pendente, Pago, Atrasado
- Despesas recorrentes (mensal, semanal, anual)
- Integração com relatórios financeiros

USUÁRIOS E PERMISSÕES:
- Sistema multi-usuário
- Roles: OWNER, STAFF, CUSTOM
- 33 permissões em 10 módulos
- Convite por email com senha temporária
- Gestão de acesso granular

SUPORTE:
- Sistema de tickets
- 5 categorias (Técnico, Financeiro, Agendamento, Geral, Sugestão)
- Prioridades (Baixa, Média, Alta, Urgente)
- Central de ajuda com 50+ FAQs

INSTRUÇÕES:
- Seja direto e prático
- Use emojis relevantes quando apropriado
- Explique passo a passo quando necessário
- Ofereça exemplos práticos
- Se não souber, seja honesto
- Mantenha tom amigável e profissional
- Adapte respostas ao contexto da página atual

Responda em português do Brasil.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    const assistantMessage = chatCompletion.choices[0]?.message?.content || 
      "Desculpe, não consegui processar sua pergunta. Tente reformular.";

    return NextResponse.json({
      message: assistantMessage,
    });
  } catch (error) {
    console.error("Erro no chat admin:", error);
    return NextResponse.json(
      { error: "Erro ao processar mensagem" },
      { status: 500 }
    );
  }
}
