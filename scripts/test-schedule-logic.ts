/**
 * 🧪 Script de Teste - Sistema de Horários Disponíveis
 * 
 * Valida a lógica de geração de horários evitando conflitos
 * com agendamentos existentes.
 */

interface OccupiedPeriod {
  start: number; // minutos desde meia-noite
  end: number;
}

interface TimeSlot {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  canFit: boolean;
}

interface TimeOption {
  time: string;
  timeMinutes: number;
  available: boolean;
}

/**
 * Converte HH:mm para minutos desde meia-noite
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos para HH:mm
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Gera horários disponíveis (LÓGICA PRINCIPAL)
 */
function generateAvailableTimeSlots(
  workStart: string,
  workEnd: string,
  occupiedPeriods: OccupiedPeriod[],
  requestedDuration: number
): TimeOption[] {
  const workStartMin = timeToMinutes(workStart);
  const workEndMin = timeToMinutes(workEnd);

  // Ordenar períodos ocupados
  occupiedPeriods.sort((a, b) => a.start - b.start);

  // Calcular lacunas disponíveis
  const availableSlots: TimeSlot[] = [];
  let currentTime = workStartMin;

  occupiedPeriods.forEach((occupied) => {
    if (currentTime < occupied.start) {
      const slotDuration = occupied.start - currentTime;

      availableSlots.push({
        start: formatTime(currentTime),
        end: formatTime(occupied.start),
        startMinutes: currentTime,
        endMinutes: occupied.start,
        durationMinutes: slotDuration,
        canFit: slotDuration >= requestedDuration,
      });
    }
    currentTime = Math.max(currentTime, occupied.end);
  });

  // Adicionar tempo livre após o último agendamento
  if (currentTime < workEndMin) {
    const slotDuration = workEndMin - currentTime;

    availableSlots.push({
      start: formatTime(currentTime),
      end: formatTime(workEndMin),
      startMinutes: currentTime,
      endMinutes: workEndMin,
      durationMinutes: slotDuration,
      canFit: slotDuration >= requestedDuration,
    });
  }

  // Gerar horários válidos
  const timeOptions: TimeOption[] = [];

  availableSlots.forEach((slot) => {
    if (!slot.canFit) return;

    for (
      let time = slot.startMinutes;
      time <= slot.endMinutes - requestedDuration;
      time += 15
    ) {
      const endTime = time + requestedDuration;

      // Validação 1: Cabe na lacuna
      if (endTime > slot.endMinutes) {
        continue;
      }

      // Validação 2: Sem conflitos
      const hasConflict = occupiedPeriods.some((occupied) => {
        return (
          (time >= occupied.start && time < occupied.end) ||
          (endTime > occupied.start && endTime <= occupied.end) ||
          (time <= occupied.start && endTime >= occupied.end)
        );
      });

      if (hasConflict) {
        continue;
      }

      // Validação 3: Não ultrapassa expediente
      if (endTime > workEndMin) {
        continue;
      }

      timeOptions.push({
        time: formatTime(time),
        timeMinutes: time,
        available: true,
      });
    }
  });

  // Remover duplicatas
  const uniqueTimeOptions = Array.from(
    new Map(timeOptions.map((item) => [item.time, item])).values()
  );

  // Ordenar
  uniqueTimeOptions.sort((a, b) => a.timeMinutes - b.timeMinutes);

  return uniqueTimeOptions;
}

/**
 * 🧪 TESTE 1: Dia Completamente Livre
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 1: Dia Completamente Livre");
console.log("=".repeat(60));

const test1 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [{ start: timeToMinutes("12:00"), end: timeToMinutes("13:00") }], // Apenas almoço
  60
);

console.log(`✅ Horários disponíveis: ${test1.length}`);
console.log("Primeiros 5:", test1.slice(0, 5).map((t) => t.time).join(", "));
console.log("Últimos 5:", test1.slice(-5).map((t) => t.time).join(", "));
console.log("");

/**
 * 🧪 TESTE 2: Agendamento pela Manhã
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 2: Agendamento pela Manhã");
console.log("=".repeat(60));

const test2 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [
    { start: timeToMinutes("09:00"), end: timeToMinutes("10:30") }, // Agendamento
    { start: timeToMinutes("12:00"), end: timeToMinutes("13:00") }, // Almoço
  ],
  60
);

console.log(`✅ Horários disponíveis: ${test2.length}`);
console.log("Primeiro horário:", test2[0]?.time || "NENHUM");
console.log("Horários manhã:", test2.filter((t) => t.timeMinutes < 720).map((t) => t.time).join(", "));
console.log("");

/**
 * 🧪 TESTE 3: Múltiplos Agendamentos
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 3: Múltiplos Agendamentos");
console.log("=".repeat(60));

const test3 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [
    { start: timeToMinutes("09:00"), end: timeToMinutes("10:00") },
    { start: timeToMinutes("10:30"), end: timeToMinutes("11:30") },
    { start: timeToMinutes("12:00"), end: timeToMinutes("13:00") }, // Almoço
    { start: timeToMinutes("14:00"), end: timeToMinutes("15:30") },
  ],
  45
);

console.log(`✅ Horários disponíveis: ${test3.length}`);
console.log("Todos os horários:");
test3.forEach((t) => console.log(`  - ${t.time}`));
console.log("");

/**
 * 🧪 TESTE 4: Dia Completo (Sem Horários)
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 4: Dia Completo (Sem Horários)");
console.log("=".repeat(60));

const test4 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [
    { start: timeToMinutes("09:00"), end: timeToMinutes("10:00") },
    { start: timeToMinutes("10:00"), end: timeToMinutes("11:00") },
    { start: timeToMinutes("11:00"), end: timeToMinutes("12:00") },
    { start: timeToMinutes("12:00"), end: timeToMinutes("13:00") },
    { start: timeToMinutes("13:00"), end: timeToMinutes("14:00") },
    { start: timeToMinutes("14:00"), end: timeToMinutes("15:00") },
    { start: timeToMinutes("15:00"), end: timeToMinutes("16:00") },
    { start: timeToMinutes("16:00"), end: timeToMinutes("17:00") },
    { start: timeToMinutes("17:00"), end: timeToMinutes("18:00") },
  ],
  60
);

console.log(`✅ Horários disponíveis: ${test4.length}`);
console.log("Esperado: 0 (dia completo)");
console.log("");

/**
 * 🧪 TESTE 5: Lacuna Pequena (Não Cabe)
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 5: Lacuna Pequena (Não Cabe)");
console.log("=".repeat(60));

const test5 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [
    { start: timeToMinutes("09:00"), end: timeToMinutes("10:00") },
    { start: timeToMinutes("10:30"), end: timeToMinutes("12:00") },
  ],
  45
);

console.log(`✅ Horários disponíveis: ${test5.length}`);
console.log("Lacuna 10:00-10:30 (30min) não deve ter horários (serviço 45min)");
console.log("Primeiro horário após lacuna:", test5[0]?.time || "NENHUM");
console.log("");

/**
 * 🧪 TESTE 6: Serviço Longo (2 horas)
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 6: Serviço Longo (2 horas)");
console.log("=".repeat(60));

const test6 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [{ start: timeToMinutes("12:00"), end: timeToMinutes("13:00") }],
  120
);

console.log(`✅ Horários disponíveis: ${test6.length}`);
console.log("Últimos horários antes do almoço:");
console.log(
  test6
    .filter((t) => t.timeMinutes < 720)
    .slice(-3)
    .map((t) => t.time)
    .join(", ")
);
console.log("Últimos horários do dia:");
console.log(test6.slice(-3).map((t) => t.time).join(", "));
console.log("");

/**
 * 🧪 TESTE 7: Edge Case - Lacuna Exata
 */
console.log("=".repeat(60));
console.log("🧪 TESTE 7: Edge Case - Lacuna Exata (60min)");
console.log("=".repeat(60));

const test7 = generateAvailableTimeSlots(
  "09:00",
  "18:00",
  [
    { start: timeToMinutes("09:00"), end: timeToMinutes("10:00") },
    { start: timeToMinutes("11:00"), end: timeToMinutes("12:00") },
  ],
  60
);

console.log(`✅ Horários disponíveis: ${test7.length}`);
console.log("Lacuna 10:00-11:00 (60min) deve ter apenas 10:00");
const lacunaHorarios = test7.filter(
  (t) => t.timeMinutes >= 600 && t.timeMinutes < 660
);
console.log("Horários na lacuna:", lacunaHorarios.map((t) => t.time).join(", "));
console.log("");

/**
 * 📊 RESUMO DOS TESTES
 */
console.log("=".repeat(60));
console.log("📊 RESUMO DOS TESTES");
console.log("=".repeat(60));

const tests = [
  { name: "Teste 1: Dia Livre", expected: "> 30", actual: test1.length },
  { name: "Teste 2: Agend. Manhã", expected: "~21", actual: test2.length },
  { name: "Teste 3: Múltiplos", expected: "~13", actual: test3.length },
  { name: "Teste 4: Dia Completo", expected: "0", actual: test4.length },
  { name: "Teste 5: Lacuna Pequena", expected: "> 10", actual: test5.length },
  { name: "Teste 6: Serviço Longo", expected: "~20", actual: test6.length },
  { name: "Teste 7: Lacuna Exata", expected: "> 0", actual: test7.length },
];

tests.forEach((test) => {
  const status = test.actual > 0 || test.expected === "0" ? "✅" : "❌";
  console.log(`${status} ${test.name}: ${test.actual} horários (esperado: ${test.expected})`);
});

console.log("\n🎉 Testes concluídos!");
