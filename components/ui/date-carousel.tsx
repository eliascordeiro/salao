"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateCarouselProps {
  dates: Date[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  className?: string;
}

export function DateCarousel({
  dates,
  selectedDate,
  onSelectDate,
  className = "",
}: DateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Verificar se pode rolar
  const checkScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        scrollElement.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [dates]);

  // Auto-scroll para data selecionada
  useEffect(() => {
    if (selectedDate && scrollRef.current) {
      const selectedIndex = dates.findIndex(
        (d) => d.toDateString() === selectedDate.toDateString()
      );
      if (selectedIndex !== -1) {
        const selectedElement = scrollRef.current.children[selectedIndex] as HTMLElement;
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      }
    }
  }, [selectedDate, dates]);

  // Rolar para esquerda
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: -320,
      behavior: "smooth",
    });
  };

  // Rolar para direita
  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: 320,
      behavior: "smooth",
    });
  };

  // Obter label especial para datas
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return null;
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Gradiente esquerda */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      )}

      {/* Botão Esquerda */}
      <Button
        variant="outline"
        size="sm"
        onClick={scrollLeft}
        disabled={!canScrollLeft}
        className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-full bg-background/95 backdrop-blur-md shadow-lg border-2 transition-all ${
          canScrollLeft
            ? "border-primary/30 hover:bg-primary hover:text-white hover:border-primary opacity-100 hover:scale-110"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Container de Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory py-2 px-12 sm:px-14"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {dates.map((date, index) => {
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();
          const specialLabel = getDateLabel(date);
          const dayName = format(date, "EEE", { locale: ptBR });

          return (
            <button
              key={date.toISOString()}
              type="button"
              className={`flex flex-col items-center justify-center h-auto py-3 sm:py-4 px-3 sm:px-4 min-w-[72px] sm:min-w-[90px] rounded-xl transition-all snap-center flex-shrink-0 border-2 ${
                isSelected
                  ? "bg-gradient-primary text-white shadow-xl shadow-primary/40 scale-105 border-primary/50"
                  : "bg-background/50 backdrop-blur-sm hover:bg-background-alt border-border/50 hover:border-primary/30 hover:scale-105 hover:shadow-lg"
              }`}
              onClick={() => onSelectDate(date)}
            >
              {/* Dia da semana */}
              <span
                className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider mb-1 ${
                  isSelected ? "text-white/80" : "text-foreground-muted"
                }`}
              >
                {dayName}
              </span>
              
              {/* Número do dia */}
              <span className="text-2xl sm:text-3xl font-bold my-1 sm:my-1.5">
                {format(date, "dd")}
              </span>
              
              {/* Mês */}
              <span
                className={`text-[10px] sm:text-xs font-medium capitalize ${
                  isSelected ? "text-white/80" : "text-foreground-muted"
                }`}
              >
                {format(date, "MMM", { locale: ptBR })}
              </span>
              
              {/* Badge especial */}
              {specialLabel && (
                <div
                  className={`mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-white/25 text-white"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {specialLabel}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Gradiente direita */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
      )}

      {/* Botão Direita */}
      <Button
        variant="outline"
        size="sm"
        onClick={scrollRight}
        disabled={!canScrollRight}
        className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-full bg-background/95 backdrop-blur-md shadow-lg border-2 transition-all ${
          canScrollRight
            ? "border-primary/30 hover:bg-primary hover:text-white hover:border-primary opacity-100 hover:scale-110"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </Button>

      {/* Indicador de Scroll para Mobile */}
      <div className="flex justify-center gap-1.5 mt-3 sm:hidden">
        {canScrollLeft && (
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
        <div className="h-1.5 w-8 rounded-full bg-primary/80" />
        {canScrollRight && (
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
      </div>

      {/* Dica de Scroll */}
      {dates.length > 5 && (
        <div className="hidden sm:flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground/60">
          <Calendar className="h-3 w-3" />
          <span>Deslize para ver mais datas</span>
        </div>
      )}
    </div>
  );
}
