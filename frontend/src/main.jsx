import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";

// Register / update the service worker on every page load
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      console.log("[SW] Registered with scope:", reg.scope);
      // Force immediate check for new sw.js
      await reg.update();
    } catch (err) {
      console.warn("[SW] Registration/update failed:", err);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
