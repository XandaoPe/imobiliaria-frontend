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
  const options = {
    body: "Nova notificação do sistema",
    icon: "/logo192.png",
    badge: "/logo192.png",
    tag: "notificacao",
  };

  event.waitUntil(
    self.registration.showNotification("Sistema Imobiliário", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/leads"));
});
