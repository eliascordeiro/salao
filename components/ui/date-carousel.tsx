"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
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
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScroll);
      return () => scrollElement.removeEventListener("scroll", checkScroll);
    }
  }, [dates]);

  // Rolar para esquerda
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  };

  // Rolar para direita
  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  };

  return (
    <div className={`relative ${className}`}>
      {/* Botão Esquerda - Visível apenas em desktop quando pode rolar */}
      {canScrollLeft && (
        <Button
          variant="outline"
          size="sm"
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border-2 border-primary/20 hover:bg-primary hover:text-white hidden sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Container de Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-10 sm:px-12"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {dates.map((date) => {
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <Button
              key={date.toISOString()}
              variant={isSelected ? "default" : "outline"}
              className={`flex flex-col h-auto py-3 px-4 min-w-[80px] sm:min-w-[90px] transition-all snap-center flex-shrink-0 ${
                isSelected
                  ? "bg-gradient-primary text-white shadow-lg shadow-primary/30 scale-105"
                  : "glass-card hover:bg-background-alt hover:border-primary/30 hover:scale-105"
              }`}
              onClick={() => onSelectDate(date)}
            >
              <span
                className={`text-xs ${
                  isSelected ? "text-white/70" : "text-foreground-muted"
                }`}
              >
                {format(date, "EEE", { locale: ptBR })}
              </span>
              <span className="text-2xl font-bold my-1">
                {format(date, "dd", { locale: ptBR })}
              </span>
              <span
                className={`text-xs ${
                  isSelected ? "text-white/70" : "text-foreground-muted"
                }`}
              >
                {format(date, "MMM", { locale: ptBR })}
              </span>
              {isToday && (
                <Badge
                  className={`mt-1 text-[10px] px-2 py-0.5 ${
                    isSelected
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-primary/20 text-primary border-primary/30"
                  }`}
                >
                  Hoje
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* Botão Direita - Visível apenas em desktop quando pode rolar */}
      {canScrollRight && (
        <Button
          variant="outline"
          size="sm"
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm shadow-lg border-2 border-primary/20 hover:bg-primary hover:text-white hidden sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Indicador de Scroll para Mobile */}
      <div className="flex justify-center gap-1 mt-3 sm:hidden">
        <div
          className={`h-1 rounded-full transition-all ${
            canScrollLeft ? "w-2 bg-primary" : "w-1 bg-muted-foreground/30"
          }`}
        />
        <div
          className={`h-1 rounded-full transition-all ${
            canScrollLeft && canScrollRight
              ? "w-4 bg-primary"
              : "w-2 bg-muted-foreground/30"
          }`}
        />
        <div
          className={`h-1 rounded-full transition-all ${
            canScrollRight ? "w-2 bg-primary" : "w-1 bg-muted-foreground/30"
          }`}
        />
      </div>
    </div>
  );
}
