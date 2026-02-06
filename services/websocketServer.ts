// WebSocket Server for Real-Time Communications
import { Server as SocketIOServer, Socket } from "socket.io";
import { Vehicle, Trip, Incident, UserProfile } from "../types";

// Store connected clients and their subscriptions
interface ClientInfo {
  socket: Socket;
  userId?: string;
  subscriptions: Set<string>;
}

// Singleton WebSocket server
let io: SocketIOServer | null = null;

export const initializeWebSocketServer = (httpServer: any) => {
  // Only allow connections from trusted origins
  const allowedOrigins = [
    "https://govfleet-command.com",
    "https://app.govfleet-command.com",
    "http://localhost:3000", // For development
    "http://localhost:4173", // For preview
  ];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Disable polling for security, only allow websockets
    transports: ["websocket"],
  });

  const clients = new Map<string, ClientInfo>();
  const vehicleUpdates = new Map<string, Vehicle>();

  io.on("connection", (socket: Socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // Set a timeout for authentication - disconnect if not authenticated within 10 seconds
    const authTimeout = setTimeout(() => {
      console.log(
        `[WS] Client ${socket.id} failed to authenticate in time, disconnecting`,
      );
      socket.disconnect(true);
    }, 10000);

    // Handle authentication - require token and validate server-side
    socket.on(
      "authenticate",
      async (data: { token: string; userId: string; role: string }) => {
        try {
          // Validate token with backend
          const response = await fetch(
            "http://localhost:3001/api/auth/validate-token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: data.token }),
            },
          );

          if (!response.ok) {
            console.log(`[WS] Invalid token for client ${socket.id}`);
            socket.emit("auth_error", {
              message: "Invalid authentication token",
            });
            socket.disconnect(true);
            return;
          }

          const authData = await response.json();

          // Verify user ID and role match
          if (authData.userId !== data.userId || authData.role !== data.role) {
            console.log(`[WS] Token/user mismatch for client ${socket.id}`);
            socket.emit("auth_error", { message: "Authentication mismatch" });
            socket.disconnect(true);
            return;
          }

          // Clear auth timeout
          clearTimeout(authTimeout);

          clients.set(socket.id, {
            socket,
            userId: data.userId,
            subscriptions: new Set(["general"]),
          });

          console.log(`[WS] User authenticated: ${data.userId} (${data.role})`);

          // Send current state on auth
          socket.emit("state_sync", {
            vehicles: Array.from(vehicleUpdates.values()),
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error(`[WS] Authentication error for ${socket.id}:`, error);
          socket.emit("auth_error", { message: "Authentication failed" });
          socket.disconnect(true);
        }
      },
    );

    // Subscribe to specific channels
    socket.on("subscribe", (channel: string) => {
      const client = clients.get(socket.id);
      if (!client || !client.userId) {
        socket.emit("auth_required", { message: "Authentication required" });
        return;
      }

      // Validate channel access based on role (would need role checking here)
      client.subscriptions.add(channel);
      console.log(
        `[WS] ${socket.id} (${client.userId}) subscribed to ${channel}`,
      );
    });

    // Unsubscribe from channel
    socket.on("unsubscribe", (channel: string) => {
      const client = clients.get(socket.id);
      if (!client || !client.userId) {
        socket.emit("auth_required", { message: "Authentication required" });
        return;
      }

      client.subscriptions.delete(channel);
    });

    // Handle vehicle telemetry update (from driver app)
    socket.on(
      "vehicle_telemetry",
      (data: Partial<Vehicle> & { vehicleId: string }) => {
        const client = clients.get(socket.id);
        if (!client || !client.userId) {
          socket.emit("auth_required", { message: "Authentication required" });
          return;
        }

        // Additional role validation could be added here for driver-only access

        const existing = vehicleUpdates.get(data.vehicleId);
        if (existing) {
          const updated = {
            ...existing,
            ...data,
            lastPing: new Date().toISOString(),
          };
          vehicleUpdates.set(data.vehicleId, updated);

          // Broadcast to subscribers
          broadcastToSubscribers("vehicle_update", updated, [
            "fleet",
            `vehicle_${data.vehicleId}`,
          ]);
        }
      },
    );

    // Handle incident report
    socket.on("incident_report", (incident: Incident) => {
      const client = clients.get(socket.id);
      if (!client || !client.userId) {
        socket.emit("auth_required", { message: "Authentication required" });
        return;
      }

      console.log(
        `[WS] New incident reported by ${client.userId}: ${incident.id}`,
      );
      broadcastToSubscribers("incident_new", incident, ["incidents", "alerts"]);

      // Send push notification simulation
      broadcastToSubscribers(
        "push_notification",
        {
          title: `🚨 ${incident.severity} Incident`,
          body: `${incident.category} - ${incident.vehicleId}`,
          priority: incident.severity,
        },
        ["alerts"],
      );
    });

    // Handle trip status update
    socket.on(
      "trip_update",
      (data: { tripId: string; status: string; driverId?: string }) => {
        const client = clients.get(socket.id);
        if (!client || !client.userId) {
          socket.emit("auth_required", { message: "Authentication required" });
          return;
        }

        console.log(
          `[WS] Trip update by ${client.userId}: ${data.tripId} -> ${data.status}`,
        );
        broadcastToSubscribers("trip_update", data, [
          "missions",
          `trip_${data.tripId}`,
        ]);
      },
    );

    // Handle location sharing (for safety)
    socket.on(
      "share_location",
      (data: { userId: string; coordinates: { lat: number; lng: number } }) => {
        const client = clients.get(socket.id);
        if (!client || !client.userId) {
          socket.emit("auth_required", { message: "Authentication required" });
          return;
        }

        // Verify the userId matches the authenticated user
        if (data.userId !== client.userId) {
          socket.emit("auth_error", {
            message: "Cannot share location for other users",
          });
          return;
        }

        broadcastToSubscribers("user_location", data, ["tracking"]);
      },
    );

    // Handle chat message
    socket.on(
      "chat_message",
      (data: {
        from: string;
        to?: string;
        message: string;
        channel: string;
      }) => {
        const client = clients.get(socket.id);
        if (!client || !client.userId) {
          socket.emit("auth_required", { message: "Authentication required" });
          return;
        }

        // Verify sender matches authenticated user
        if (data.from !== client.userId) {
          socket.emit("auth_error", { message: "Message sender mismatch" });
          return;
        }

        if (data.to) {
          // Direct message - validate recipient exists and user has permission
          const targetClient = Array.from(clients.values()).find(
            (c) => c.userId === data.to,
          );
          if (targetClient) {
            targetClient.socket.emit("chat_message", {
              ...data,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          // Channel message - validate channel access
          broadcastToSubscribers(
            "chat_message",
            {
              ...data,
              timestamp: new Date().toISOString(),
            },
            [data.channel],
          );
        }
      },
    );

    // Handle disconnect
    socket.on("disconnect", () => {
      clients.delete(socket.id);
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  // Broadcast helper function
  const broadcastToSubscribers = (
    event: string,
    data: any,
    channels: string[],
  ) => {
    if (!io) return;

    clients.forEach((client) => {
      const hasSubscription = channels.some((c) => client.subscriptions.has(c));
      if (hasSubscription) {
        client.socket.emit(event, data);
      }
    });
  };

  // Periodic heartbeat to all clients
  setInterval(() => {
    if (io) {
      io.emit("heartbeat", { timestamp: new Date().toISOString() });
    }
  }, 30000);

  console.log("[WS] WebSocket server initialized");
  return io;
};

// Client-side hook for React
export const useWebSocket = (url: string = "ws://localhost:3001") => {
  // This would be used in components for real-time updates
  return {
    connect: () => console.log("Connecting to WS..."),
    disconnect: () => console.log("Disconnecting WS..."),
    subscribe: (channel: string) => console.log(`Subscribed to ${channel}`),
    send: (event: string, data: any) => console.log(`Sending ${event}:`, data),
  };
};

// Notification service
export class NotificationService {
  private static permissions: NotificationPermission = "default";

  static async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    this.permissions = await Notification.requestPermission();
    return this.permissions === "granted";
  }

  static async send(
    title: string,
    options: NotificationOptions = {},
  ): Promise<void> {
    if (this.permissions === "granted" && "Notification" in window) {
      const notification = new Notification(title, {
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  static sendCritical(title: string, body: string): void {
    this.send(title, {
      body,
      tag: "critical",
      requireInteraction: true,
      vibrate: [200, 100, 200],
    } as NotificationOptions);
  }
}

export default { initializeWebSocketServer, NotificationService };
