"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error(
        JSON.stringify({
          level: "error",
          event: "client.unhandled_rejection",
          time: new Date().toISOString(),
          error: event.reason instanceof Error ? event.reason.message : String(event.reason)
        })
      );
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
