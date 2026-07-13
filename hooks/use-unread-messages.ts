"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Faz polling do total de mensagens não lidas do usuário logado.
 * - ADMIN/STAFF → busca ownerUnreadCount das conversas do salão.
 * - CLIENT → busca clientUnreadCount.
 * Retorna 0 se não autenticado ou em caso de erro.
 */
export function useUnreadMessages(intervalMs = 15000) {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/conversations");
        if (!res.ok) return;
        const data: { unreadCount: number }[] = await res.json();
        const total = data.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
        setUnreadCount(total);
      } catch {
        // silencioso
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, intervalMs);
    return () => clearInterval(interval);
  }, [session?.user?.id, intervalMs]);

  return unreadCount;
}
