"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, X } from "lucide-react";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "unsupported" | "checking" | "default" | "subscribed" | "denied";

export function PushOptIn() {
  const [state, setState] = useState<State>("checking");
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar suporte
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    // Buscar chave VAPID do servidor
    fetch("/api/push/vapid-key")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.publicKey) {
          setState("unsupported");
          return;
        }
        setVapidKey(data.publicKey);
        // Verificar se já está inscrito
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => reg.pushManager.getSubscription())
          .then((sub) => setState(sub ? "subscribed" : "default"))
          .catch(() => setState("default"));
      })
      .catch(() => setState("unsupported"));
  }, []);

  async function subscribe() {
    if (!vapidKey) return;
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      });
      if (res.ok) setState("subscribed");
    } catch {
      // silencioso
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("default");
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported" || state === "checking" || dismissed) return null;

  if (state === "subscribed") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
        <BellRing className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <p className="flex-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Notificações ativadas — você será avisado sobre seus agendamentos.
        </p>
        <button
          onClick={unsubscribe}
          disabled={busy}
          title="Desativar notificações"
          className="rounded-full p-1 text-emerald-600 transition hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
        <BellOff className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">
          Notificações bloqueadas. Habilite nas configurações do navegador.
        </p>
        <button onClick={() => setDismissed(true)} className="text-amber-500">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // state === "default"
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-purple-50 px-4 py-4 ring-1 ring-purple-100 dark:bg-purple-500/10 dark:ring-purple-500/20">
      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">
          Ativar notificações
        </p>
        <p className="mt-0.5 text-xs text-purple-700 dark:text-purple-300">
          Receba avisos de confirmação, lembretes e atualizações dos seus agendamentos.
        </p>
        <button
          onClick={subscribe}
          disabled={busy}
          className="mt-3 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          Ativar notificações
        </button>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-purple-400 hover:text-purple-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
