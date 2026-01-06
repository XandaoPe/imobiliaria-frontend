// public/firebase-messaging-sw.js
console.log("🔥 Firebase Messaging Service Worker carregado");

self.addEventListener("install", (event) => {
  console.log("✅ Service Worker instalado");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker ativado");
  event.waitUntil(clients.claim());
});

// Handler para mensagens push
self.addEventListener("push", (event) => {
  console.log("📲 Push recebido no Service Worker");

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      notification: {
        title: "Nova Notificação",
        body: "Você tem uma nova mensagem",
      },
    };
  }

  const options = {
    body: data.notification?.body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
    data: data.data || {},
    tag: "push-notification-" + Date.now(), // ⭐️ TAG ÚNICA
    requireInteraction: true,
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Fechar" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.notification?.title || "Sistema Imobiliário",
      options
    )
  );
});

// Handler para clique em notificação
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notificação clicada:", event.notification.tag);
  event.notification.close();

  const url = event.notification.data?.url || "/leads";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});
