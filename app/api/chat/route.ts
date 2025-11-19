import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, salonId } = await request.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key não configurada" },
        { status: 500 }
      );
    }

    // Buscar informações do salão
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        services: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
        staff: {
          where: { active: true },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Criar contexto do sistema
    const systemPrompt = `Você é um assistente virtual inteligente do salão "${salon.name}".

INFORMAÇÕES DO SALÃO:
- Nome: ${salon.name}
- Endereço: ${salon.address}, ${salon.city} - ${salon.state}
- Telefone: ${salon.phone}
${salon.email ? `- Email: ${salon.email}` : ''}
- Horário de Funcionamento: ${salon.openTime} às ${salon.closeTime}
- Dias de Funcionamento: ${formatWorkDays(salon.workDays)}

SERVIÇOS DISPONÍVEIS (${salon.services.length}):
${salon.services.map(s => 
  `• ${s.name}: R$ ${s.price.toFixed(2)} (Duração: ${s.duration} minutos)${s.description ? `\n  ${s.description}` : ''}`
).join('\n')}

PROFISSIONAIS (${salon.staff.length}):
${salon.staff.map(s => 
  `• ${s.name}${s.specialty ? ` - Especialidade: ${s.specialty}` : ''}`
).join('\n')}

INSTRUÇÕES IMPORTANTES:
1. Seja extremamente cordial, prestativo e use linguagem natural brasileira
2. Responda de forma objetiva mas amigável (máximo 3-4 linhas)
3. Ajude o cliente a entender os serviços e preços
4. Se o cliente quiser agendar, diga: "Para agendar, clique no botão 'Agendar Agora' acima e escolha o serviço desejado!"
5. Se perguntarem sobre disponibilidade de horários, diga: "Nosso sistema mostra os horários disponíveis em tempo real. Clique em 'Agendar Agora' para ver!"
6. NUNCA invente informações - use APENAS os dados fornecidos acima
7. Se não souber algo, seja honesto e sugira contato direto: "Para essa informação específica, recomendo ligar no ${salon.phone}"
8. Seja proativo: se o cliente demonstrar interesse, sugira agendar
9. Use emojis moderadamente para ser mais amigável (💇‍♀️ ✨ 📅 ⏰)
10. Se perguntarem sobre cancelamento ou alteração, oriente: "Você pode gerenciar seus agendamentos na área 'Meus Agendamentos' após fazer login"

EXEMPLOS DE BOAS RESPOSTAS:
- "Olá! 😊 Trabalhamos com cortes femininos e masculinos, coloração, hidratação e muito mais. Qual serviço você tem interesse?"
- "O corte feminino custa R$ 80,00 e dura cerca de 60 minutos. Quer agendar? É só clicar em 'Agendar Agora'!"
- "Trabalhamos de segunda a sexta, das 9h às 18h. Para ver os horários disponíveis, clique em 'Agendar Agora' 📅"

Seja natural, humano e ajude o cliente a tomar a melhor decisão!`;

    // Chamar API do Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: Message) => ({
          role: m.role === "system" ? "system" : m.role,
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      "Desculpe, não consegui processar sua mensagem. Tente novamente!";

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage,
    });
  } catch (error) {
    console.error("Erro no chat:", error);
    return NextResponse.json(
      { 
        error: "Erro ao processar mensagem",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

// Helper para formatar dias da semana
function formatWorkDays(workDays: string): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const workDaysArray = workDays.split(',').map(d => parseInt(d.trim()));
  return workDaysArray.map(d => days[d]).join(', ');
}
