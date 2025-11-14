"use client";

import { Button } from "./button";
import { Calendar, Download } from "lucide-react";
import {
  generateICSFile,
  downloadICSFile,
  createCalendarEventFromBooking,
} from "@/lib/utils/calendar";

interface AddToCalendarButtonProps {
  booking: {
    service: { name: string; duration: number };
    staff: { name: string };
    salon: { name: string; address?: string; phone?: string };
    date: string;
  };
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function AddToCalendarButton({
  booking,
  variant = "outline",
  size = "default",
  className = "",
}: AddToCalendarButtonProps) {
  const handleAddToCalendar = () => {
    try {
      const event = createCalendarEventFromBooking(booking);
      const icsContent = generateICSFile(event);
      const filename = `agendamento-${booking.salon.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-${booking.service.name
        .toLowerCase()
        .replace(/\s+/g, "-")}.ics`;
      
      downloadICSFile(icsContent, filename);
    } catch (error) {
      console.error("Erro ao gerar arquivo de calendário:", error);
      alert("Erro ao adicionar ao calendário. Tente novamente.");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      className={`gap-2 ${className}`}
    >
      <Calendar className="h-4 w-4" />
      <span className="hidden sm:inline">Adicionar ao Calendário</span>
      <span className="sm:hidden">Calendário</span>
      <Download className="h-3 w-3 ml-1 opacity-60" />
    </Button>
  );
}
