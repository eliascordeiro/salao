// Service Worker — AgendaSalão PWA
// Suporta: Web Push Notifications + Install prompt

const CACHE_NAME = "agendasalao-v1";

// ─── Ciclo de vida ────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpar caches antigos
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      ),
    ])
  );
});

// ─── Fetch (passthrough) ──────────────────────────────────────────────────────
// Necessário para os critérios de instalabilidade (PWA / "Adicionar à tela
// inicial") em diversos navegadores — não faz cache agressivo, apenas
// repassa a requisição direto para a rede.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// ─── Web Push ─────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "AgendaSalão",
      body: event.data ? event.data.text() : "Você tem uma atualização.",
    };
  }

  const title = data.title || "AgendaSalão";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "agendasalao",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/meus-agendamentos" },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Clique na notificação ────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) ||
    "/meus-agendamentos";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      })
  );
});
