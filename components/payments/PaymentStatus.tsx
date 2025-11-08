"use client";

import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  Ban,
} from "lucide-react";

interface PaymentStatusProps {
  status: string;
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  PENDING: {
    label: "Aguardando Pagamento",
    icon: Clock,
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    borderColor: "border-yellow-200",
  },
  PROCESSING: {
    label: "Processando",
    icon: RefreshCw,
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    borderColor: "border-blue-200",
  },
  COMPLETED: {
    label: "Pago",
    icon: CheckCircle,
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    borderColor: "border-green-200",
  },
  FAILED: {
    label: "Falhou",
    icon: XCircle,
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    borderColor: "border-red-200",
  },
  REFUNDED: {
    label: "Reembolsado",
    icon: AlertCircle,
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    borderColor: "border-purple-200",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: Ban,
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    borderColor: "border-gray-200",
  },
};

export default function PaymentStatus({
  status,
  className = "",
  showLabel = true,
}: PaymentStatusProps) {
  const config =
    statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && config.label}
    </span>
  );
}
