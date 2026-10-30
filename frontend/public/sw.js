// Service Worker for Web Push alerts
// Only handles install, activate, push, and notificationclick (no fetch or caching)

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let data = {};
      if (event.data) {
        try {
          data = event.data.json();
        } catch (e) {
          data = { title: "Kaindra Alert", body: event.data.text() };
        }
      }

      // Query open browser tabs for this origin
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // If any window client is visible AND focused, do NOT show a system notification
      const isAnyFocusedAndVisible = clientList.some(
        (client) => client.focused && client.visibilityState === "visible"
      );

      if (isAnyFocusedAndVisible) {
        // Forward payload to active page so in-app notification UI / toast handles it
        clientList.forEach((client) => {
          client.postMessage({
            type: "PUSH_NOTIFICATION_RECEIVED",
            payload: data,
          });
        });
        return;
      }

      const title = data.title || "Kaindra Notification";
      const targetUrl = data.data?.url || data.url || "/";

      const options = {
        body: data.body || "",
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        data: {
          url: targetUrl,
          type: data.type || "SYSTEM",
        },
      };

      return self.registration.showNotification(title, options);
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

      // Check if there is already an open window/tab to focus
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            await client.navigate(targetUrl);
          }
          return;
        }
      }

      // If no open tab is available, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});
