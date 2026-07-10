"use client";

import { useEffect } from "react";

/**
 * Registra o Service Worker em TODAS as páginas do site, independente de o
 * usuário aceitar notificações push ou não. Isso é essencial para o
 * critério de "instalabilidade" do PWA (ícone de instalar/adicionar à tela
 * inicial) — o navegador só oferece o app para instalação se houver um
 * Service Worker ativo no escopo da página visitada.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silencioso: navegadores sem suporte ou contexto não seguro (http)
    });
  }, []);

  return null;
}
