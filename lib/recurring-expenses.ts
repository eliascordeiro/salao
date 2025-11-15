import { prisma } from "@/lib/prisma";
import { addDays, addMonths, addYears, startOfDay, isBefore } from "date-fns";

/**
 * Serviço para processar despesas recorrentes
 * Este serviço deve ser executado diariamente (cron job)
 */

interface RecurringExpenseResult {
  processed: number;
  created: number;
  errors: string[];
}

export async function processRecurringExpenses(): Promise<RecurringExpenseResult> {
  const result: RecurringExpenseResult = {
    processed: 0,
    created: 0,
    errors: [],
  };

  try {
    console.log("🔄 Iniciando processamento de despesas recorrentes...");
    const today = startOfDay(new Date());

    // Buscar todas as despesas recorrentes ativas
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
        status: { not: "OVERDUE" }, // Não processar despesas atrasadas
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(`📋 Encontradas ${recurringExpenses.length} despesas recorrentes`);

    for (const expense of recurringExpenses) {
      try {
        result.processed++;

        // Verificar se já foi gerada recentemente
        if (expense.lastGenerated) {
          const daysSinceLastGeneration = Math.floor(
            (today.getTime() - expense.lastGenerated.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Regras de geração baseadas na frequência
          let shouldGenerate = false;

          switch (expense.recurrence) {
            case "WEEKLY":
              shouldGenerate = daysSinceLastGeneration >= 7;
              break;
            case "MONTHLY":
              shouldGenerate = daysSinceLastGeneration >= 28; // Aproximadamente 1 mês
              break;
            case "YEARLY":
              shouldGenerate = daysSinceLastGeneration >= 365;
              break;
          }

          if (!shouldGenerate) {
            console.log(
              `⏭️ Pulando despesa "${expense.description}" - última geração há ${daysSinceLastGeneration} dias`
            );
            continue;
          }
        }

        // Calcular próxima data de vencimento
        const nextDueDate = calculateNextDueDate(
          expense.dueDate,
          expense.recurrence!,
          expense.recurringDay
        );

        // Verificar se a próxima data já passou (deve gerar)
        if (isBefore(nextDueDate, today)) {
          console.log(
            `✅ Gerando nova despesa recorrente: "${expense.description}" (${expense.salon.name})`
          );

          // Criar nova despesa
          await prisma.expense.create({
            data: {
              salonId: expense.salonId,
              description: expense.description,
              category: expense.category,
              amount: expense.amount,
              status: "PENDING",
              dueDate: nextDueDate,
              paymentMethod: expense.paymentMethod,
              notes: expense.notes
                ? `${expense.notes}\n[Despesa recorrente gerada automaticamente]`
                : "[Despesa recorrente gerada automaticamente]",
              isRecurring: false, // Despesas geradas não são recorrentes
              parentExpenseId: expense.id,
            },
          });

          // Atualizar lastGenerated da despesa original
          await prisma.expense.update({
            where: { id: expense.id },
            data: {
              lastGenerated: today,
              // Atualizar dueDate para a próxima ocorrência
              dueDate: nextDueDate,
            },
          });

          result.created++;
          console.log(`✅ Nova despesa criada com vencimento em ${nextDueDate.toLocaleDateString("pt-BR")}`);
        } else {
          console.log(
            `⏭️ Próxima geração de "${expense.description}" será em ${nextDueDate.toLocaleDateString("pt-BR")}`
          );
        }
      } catch (error) {
        const errorMsg = `Erro ao processar despesa ${expense.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log(
      `✅ Processamento concluído: ${result.created} despesas criadas de ${result.processed} processadas`
    );
  } catch (error) {
    const errorMsg = `Erro ao buscar despesas recorrentes: ${error}`;
    console.error(`❌ ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Calcula a próxima data de vencimento baseada na recorrência
 */
function calculateNextDueDate(
  currentDueDate: Date,
  recurrence: string,
  recurringDay: number | null
): Date {
  const current = new Date(currentDueDate);

  switch (recurrence) {
    case "WEEKLY":
      // Adiciona 7 dias
      return addDays(current, 7);

    case "MONTHLY":
      // Adiciona 1 mês
      let nextMonth = addMonths(current, 1);
      
      // Se recurringDay foi especificado, ajustar para o dia correto
      if (recurringDay && recurringDay >= 1 && recurringDay <= 31) {
        nextMonth.setDate(recurringDay);
      }
      
      return nextMonth;

    case "YEARLY":
      // Adiciona 1 ano
      return addYears(current, 1);

    default:
      // Fallback: adiciona 1 mês
      return addMonths(current, 1);
  }
}

/**
 * Helper para executar o processamento manualmente (para testes)
 */
export async function runRecurringExpensesJob() {
  console.log("🚀 Executando job de despesas recorrentes...");
  const result = await processRecurringExpenses();
  
  console.log("\n📊 Resultado:");
  console.log(`   Processadas: ${result.processed}`);
  console.log(`   Criadas: ${result.created}`);
  console.log(`   Erros: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log("\n❌ Erros:");
    result.errors.forEach((error) => console.log(`   - ${error}`));
  }
  
  return result;
}
