// PWA Support Service for GovFleet Command
// Provides offline capability, install prompts, and service worker management

export interface PWAInstallPrompt {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: "standalone" | "fullscreen" | "minimal-ui";
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
}

export const PWAService = {
  // Check if running as PWA
  isStandalone: (): boolean => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://") ||
      false
    );
  },

  // Check if PWA is installable
  isInstallable: (): boolean => {
    if (typeof window === "undefined") return false;
    const nav = window.navigator as Record<string, any>;
    return "standalone" in nav || nav.standalone === false;
  },

  // Register service worker
  registerServiceWorker:
    async (): Promise<ServiceWorkerRegistration | null> => {
      if (typeof window === "undefined") return false;
      if (!("serviceWorker" in navigator)) {
        console.log("[PWA] Service Worker not supported");
        return null;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("[PWA] Service Worker registered:", registration.scope);
        return registration;
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
        return null;
      }
    },

  // Request install prompt
  requestInstallPrompt: async (): Promise<PWAInstallPrompt | null> => {
    if (typeof window === "undefined") return null;

    const deferredPrompt = (window as Record<string, any>).deferredPrompt;
    if (!deferredPrompt) {
      console.log("[PWA] Install prompt not available");
      return null;
    }

    return {
      prompt: async () => {
        deferredPrompt.prompt();
        return deferredPrompt.userChoice;
      },
      userChoice: deferredPrompt.userChoice,
    };
  },

  // Check for updates
  checkForUpdates: async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      console.log("[PWA] New update available");
      return true;
    }
    return false;
  },

  // Apply update
  applyUpdate: async (): Promise<void> => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  },

  // Cache strategies
  cacheStrategies: {
    // Cache first, then network
    cacheFirst: async (request: Request): Promise<Response> => {
      const cache = await caches.open("govfleet-static");
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    },

    // Network first, then cache
    networkFirst: async (request: Request): Promise<Response> => {
      const cache = await caches.open("govfleet-dynamic");
      try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        throw error;
      }
    },

    // Stale while revalidate
    staleWhileRevalidate: async (request: Request): Promise<Response> => {
      const cache = await caches.open("govfleet-dynamic");
      const cachedResponse = await cache.match(request);

      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });

      return cachedResponse || fetchPromise;
    },
  },

  // Offline data sync queue
  syncQueue: {
    add: async (item: {
      id: string;
      type: string;
      data: any;
    }): Promise<void> => {
      const db = await openDB();
      await db.put("sync-queue", item);
    },

    getAll: async (): Promise<
      Array<{ id: string; type: string; data: any }>
    > => {
      const db = await openDB();
      return db.getAll("sync-queue");
    },

    remove: async (id: string): Promise<void> => {
      const db = await openDB();
      await db.delete("sync-queue", id);
    },

    process: async (): Promise<void> => {
      const queue = await PWAService.syncQueue.getAll();
      for (const item of queue) {
        try {
          // Process based on type
          console.log("[Sync] Processing:", item);
          // Remove from queue on success
          await PWAService.syncQueue.remove(item.id);
        } catch (error) {
          console.error("[Sync] Failed to process:", item.id, error);
        }
      }
    },
  },

  // Background sync
  registerBackgroundSync: async (tag: string): Promise<void> => {
    if (
      "serviceWorker" in navigator &&
      "sync" in (ServiceWorkerRegistration.prototype as any)
    ) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
    }
  },
};

// IndexedDB helper
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("govfleet-offline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("sync-queue")) {
        db.createObjectStore("sync-queue", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cached-data")) {
        db.createObjectStore("cached-data", { keyPath: "key" });
      }
    };
  });
};

// Generate PWA manifest
export const generateManifest = (): PWAManifest => {
  return {
    name: "GovFleet Command",
    short_name: "GovFleet",
    description: "Secure government-grade fleet command platform",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0ea5e9",
    icons: [
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/icon-152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
};

// Hook for React components
export const usePWA = () => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(
    null,
  );
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    setIsStandalone(PWAService.isStandalone());

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as Record<string, any>).deferredPrompt = e;
      setInstallPrompt(PWAService.requestInstallPrompt());
    };

    // Listen for update
    const handleServiceWorkerUpdate = () => {
      setNeedsUpdate(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    navigator.serviceWorker?.addEventListener(
      "message",
      handleServiceWorkerUpdate,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      navigator.serviceWorker?.removeEventListener(
        "message",
        handleServiceWorkerUpdate,
      );
    };
  }, []);

  return {
    isStandalone,
    installPrompt,
    needsUpdate,
    install: installPrompt?.prompt,
    update: PWAService.applyUpdate,
  };
};

import { useState, useEffect } from "react";

export default PWAService;
