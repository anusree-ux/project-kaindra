// Service Worker for Web Push alerts v3.2
// Guaranteed system notification - no suppression, no in-app fallback
// skipWaiting ensures this version activates immediately on update

self.addEventListener("install", (event) => {
  console.log("[SW v3.2] Installing...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW v3.2] Activated - claiming all clients");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[SW v3.2] Push event received");

  event.waitUntil(
    (async () => {
      let data = {};
      if (event.data) {
        try {
          data = event.data.json();
          console.log("[SW v3.2] Push data:", JSON.stringify(data));
        } catch (e) {
          data = { title: "Kaindra Alert", body: event.data.text() };
          console.log("[SW v3.2] Push raw text:", event.data.text());
        }
      }

      // Notify all open tabs so the notification list refreshes
      try {
        const clientList = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        clientList.forEach((client) => {
          client.postMessage({ type: "PUSH_NOTIFICATION_RECEIVED", payload: data });
        });
      } catch (err) {
        console.warn("[SW v3.2] postMessage to clients failed:", err);
      }

      const title = data.title || "Kaindra";
      const body = data.body || "";
      const targetUrl = data.data?.url || data.url || "/";

      const iconUrl = self.location ? `${self.location.origin}/icon-192.png` : undefined;

      // Attempt 1: Standard notification with absolute icon URL
      try {
        await self.registration.showNotification(title, {
          body,
          icon: iconUrl,
          tag: data.tag || undefined,
          data: { url: targetUrl },
        });
        console.log("[SW v3.3] Notification shown successfully");
        return;
      } catch (err) {
        console.warn("[SW v3.3] showNotification attempt 1 failed:", err.message);
      }

      // Attempt 2: Minimal fallback (plain text only)
      try {
        await self.registration.showNotification(title, {
          body,
          data: { url: targetUrl },
        });
        console.log("[SW v3.3] Notification shown (minimal fallback)");
      } catch (err2) {
        console.error("[SW v3.3] All showNotification attempts failed:", err2.message);
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })()
  );
});
