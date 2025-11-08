"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { GlassCard } from "./glass-card";

interface CalendarPickerProps {
  selectedDate: string; // YYYY-MM-DD
  onDateSelect: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  disabledDates?: string[]; // Array de datas YYYY-MM-DD
  highlightedDates?: string[]; // Array de datas YYYY-MM-DD com destaque
  onMonthChange?: (month: string) => void; // Callback quando mês muda (YYYY-MM)
}

export function CalendarPicker({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
  highlightedDates = [],
  onMonthChange,
}: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate + "T00:00:00");
    }
    return new Date();
  });

  // Notificar mudança de mês
  useEffect(() => {
    if (onMonthChange) {
      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
      onMonthChange(`${year}-${month}`);
    }
  }, [currentMonth, onMonthChange]);

  // Nomes dos meses e dias da semana
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Navegar entre meses
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Gerar dias do calendário
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Dia da semana do primeiro dia (0 = Domingo)
    const startingDayOfWeek = firstDay.getDay();
    
    // Total de dias no mês
    const daysInMonth = lastDay.getDate();
    
    const days: Array<{
      date: Date | null;
      dateString: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isDisabled: boolean;
      isHighlighted: boolean;
    }> = [];
    
    // Preencher dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(year, month - 1, day);
      days.push({
        date,
        dateString: formatDateToString(date),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: true,
        isHighlighted: false,
      });
    }
    
    // Preencher dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateToString(date);
      const today = formatDateToString(new Date());
      
      days.push({
        date,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        isDisabled: isDateDisabled(dateString),
        isHighlighted: highlightedDates.includes(dateString),
      });
    }
    
    // Preencher dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length; // 6 semanas * 7 dias
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        dateString: formatDateToString(date),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isDisabled: true,
        isHighlighted: false,
      });
    }
    
    return days;
  };

  // Formatar data para YYYY-MM-DD
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Verificar se data está desabilitada
  const isDateDisabled = (dateString: string): boolean => {
    // Verificar data mínima
    if (minDate && dateString < minDate) return true;
    
    // Verificar data máxima
    if (maxDate && dateString > maxDate) return true;
    
    // Verificar datas desabilitadas
    if (disabledDates.includes(dateString)) return true;
    
    return false;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="w-full">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-primary/10 transition text-foreground hover:text-primary"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-foreground">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition"
          >
            Hoje
          </button>
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-primary/10 transition text-foreground hover:text-primary"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grade do Calendário */}
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-foreground-muted py-2"
          >
            {day}
          </div>
        ))}
        
        {/* Dias do calendário */}
        {calendarDays.map((day, index) => {
          const isWeekend = day.date && (day.date.getDay() === 0 || day.date.getDay() === 6);
          
          return (
            <button
              key={index}
              onClick={() => {
                if (day.isCurrentMonth && !day.isDisabled && day.date) {
                  onDateSelect(day.dateString);
                }
              }}
              disabled={day.isDisabled || !day.isCurrentMonth}
              className={`
                relative aspect-square p-2 rounded-lg text-sm font-medium transition
                ${!day.isCurrentMonth ? "text-foreground-muted/30" : ""}
                ${day.isToday ? "ring-2 ring-primary/50" : ""}
                ${day.isSelected 
                  ? "bg-primary text-white shadow-lg shadow-primary/30" 
                  : day.isHighlighted
                  ? "bg-accent/20 text-accent border-2 border-accent/50"
                  : day.isDisabled || !day.isCurrentMonth
                  ? "text-foreground-muted/40 cursor-not-allowed"
                  : isWeekend
                  ? "text-foreground hover:bg-accent/10 hover:text-accent"
                  : "text-foreground hover:bg-primary/10 hover:text-primary"
                }
              `}
            >
              {day.date?.getDate()}
              
              {/* Indicador de destaque */}
              {day.isHighlighted && !day.isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
              )}
              
              {/* Indicador de hoje */}
              {day.isToday && !day.isSelected && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Data selecionada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-lg ring-2 ring-primary/50" />
          <span>Hoje</span>
        </div>
        {highlightedDates.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-lg bg-accent/20 border-2 border-accent/50" />
            <span>Com agendamentos</span>
          </div>
        )}
      </div>
    </div>
  );
}
