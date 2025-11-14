import { format } from "date-fns";

interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

/**
 * Gera um arquivo .ics (iCalendar) para download
 * Compatível com Google Calendar, Outlook, Apple Calendar, etc.
 */
export function generateICSFile(event: CalendarEventData): string {
  const formatDate = (date: Date): string => {
    // Formato: YYYYMMDDTHHmmss
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const escapeText = (text: string): string => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agenda Salão//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDate(event.endDate)}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    event.url ? `URL:${event.url}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    `UID:${Date.now()}@agendasalao.com.br`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icsContent;
}

/**
 * Faz download de um arquivo .ics
 */
export function downloadICSFile(
  content: string,
  filename: string = "agendamento.ics"
) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Cria um evento de calendário a partir de um agendamento
 */
export function createCalendarEventFromBooking(booking: {
  service: { name: string; duration: number };
  staff: { name: string };
  salon: { name: string; address?: string; phone?: string };
  date: string;
}): CalendarEventData {
  // Converter string de data ISO para Date
  const startDate = new Date(booking.date);

  // Calcular hora de término baseada na duração do serviço
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + booking.service.duration);

  const title = `${booking.service.name} - ${booking.salon.name}`;
  
  const descriptionParts = [
    `Serviço: ${booking.service.name}`,
    `Profissional: ${booking.staff.name}`,
    `Duração: ${booking.service.duration} minutos`,
  ];
  
  if (booking.salon.phone) {
    descriptionParts.push(`Telefone: ${booking.salon.phone}`);
  }
  
  descriptionParts.push("", "Agendamento via Agenda Salão");
  
  const description = descriptionParts.join("\\n");

  const location = booking.salon.address || booking.salon.name;

  return {
    title,
    description,
    location,
    startDate,
    endDate,
  };
}
