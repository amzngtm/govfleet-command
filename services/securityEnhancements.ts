// Security Enhancements Service
// Biometric auth, session recording, compliance exports

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type:
    | "LOGIN"
    | "LOGOUT"
    | "FAILED_LOGIN"
    | "PASSWORD_CHANGE"
    | "PERMISSION_CHANGE"
    | "DATA_EXPORT"
    | "SUSPICIOUS_ACTIVITY";
  userId: string;
  userName: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface SessionInfo {
  id: string;
  userId: string;
  startTime: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface ComplianceExport {
  id: string;
  type: "GDPR" | "FOIA" | "AUDIT" | "CUSTOM";
  requestedBy: string;
  requestedAt: string;
  status: "PENDING" | "PROCESSING" | "READY" | "DELIVERED";
  downloadUrl?: string;
  expiresAt?: string;
}

// Biometric Authentication
export const BiometricAuth = {
  // Check if biometric is available
  isAvailable: async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    return !!(window as any).PublicKeyCredential;
  },

  // Check if user has registered credentials
  isRegistered: async (userId: string): Promise<boolean> => {
    // Check localStorage for credential registration
    if (typeof window === "undefined") return false;
    const credentials = localStorage.getItem(`biometric_${userId}`);
    return !!credentials;
  },

  // Register biometric credentials
  register: async (userId: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    try {
      // In production, this would use WebAuthn API
      // const credential = await navigator.credentials.create({
      //   publicKey: {
      //     challenge: crypto.randomBytes(32),
      //     rp: { name: "GovFleet Command" },
      //     user: { id: new TextEncoder().encode(userId), name: userId },
      //     pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      //   }
      // });

      // For demo, store flag
      localStorage.setItem(`biometric_${userId}`, Date.now().toString());
      return true;
    } catch (error) {
      console.error("[Biometric] Registration failed:", error);
      return false;
    }
  },

  // Authenticate with biometric
  authenticate: async (userId: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    try {
      // In production, this would use WebAuthn API
      // const credential = await navigator.credentials.get({
      //   publicKey: {
      //     challenge: crypto.randomBytes(32),
      //   }
      // });

      return true;
    } catch (error) {
      console.error("[Biometric] Authentication failed:", error);
      return false;
    }
  },

  // Remove biometric credentials
  remove: async (userId: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    localStorage.removeItem(`biometric_${userId}`);
    return true;
  },
};

// Session Recording for Training/Compliance
export const SessionRecorder = {
  startRecording: (sessionId: string): void => {
    const session = {
      id: sessionId,
      startTime: new Date().toISOString(),
      actions: [],
    };
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
  },

  recordAction: (sessionId: string, action: string, details: any): void => {
    if (typeof window === "undefined") return;

    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (!sessionData) return;

    const session = JSON.parse(sessionData);
    session.actions.push({
      timestamp: new Date().toISOString(),
      action,
      details,
    });
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
  },

  stopRecording: (sessionId: string): any => {
    if (typeof window === "undefined") return null;

    const sessionData = localStorage.getItem(`session_${sessionId}`);
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    session.endTime = new Date().toISOString();
    session.duration =
      new Date(session.endTime).getTime() -
      new Date(session.startTime).getTime();

    return session;
  },

  getSession: (sessionId: string): any => {
    if (typeof window === "undefined") return null;
    const sessionData = localStorage.getItem(`session_${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  },
};

// Compliance Export Service
export const ComplianceExport = {
  // Export data for GDPR
  exportGDPR: async (userId: string): Promise<Blob> => {
    // In production, this would fetch actual user data from database
    const data = {
      userId,
      exportedAt: new Date().toISOString(),
      type: "GDPR Export",
      data: {
        profile: {},
        trips: [],
        incidents: [],
        preferences: {},
      },
    };
    return new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
  },

  // Export data for FOIA
  exportFOIA: async (
    requestId: string,
    filters: Record<string, any>,
  ): Promise<Blob> => {
    const data = {
      requestId,
      exportedAt: new Date().toISOString(),
      type: "FOIA Export",
      filters,
      data: [],
    };
    return new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
  },

  // Generate audit report
  generateAuditReport: async (
    startDate: Date,
    endDate: Date,
  ): Promise<Blob> => {
    const events = SecurityEventLog.getEvents(startDate, endDate);
    const report = {
      generatedAt: new Date().toISOString(),
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      summary: {
        totalEvents: events.length,
        criticalEvents: events.filter(
          (e: SecurityEvent) => e.severity === "CRITICAL",
        ).length,
        loginAttempts: events.filter((e: SecurityEvent) => e.type === "LOGIN")
          .length,
        failedLogins: events.filter(
          (e: SecurityEvent) => e.type === "FAILED_LOGIN",
        ).length,
      },
      events: events,
    };
    return new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
  },

  // Download export
  downloadExport: (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// Security Event Logging
export const SecurityEventLog = {
  events: [] as SecurityEvent[],

  log: (event: Omit<SecurityEvent, "id" | "timestamp">): void => {
    const fullEvent: SecurityEvent = {
      ...event,
      id: `sec-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    SecurityEventLog.events.push(fullEvent);

    // Keep only last 1000 events
    if (SecurityEventLog.events.length > 1000) {
      SecurityEventLog.events = SecurityEventLog.events.slice(-1000);
    }

    console.log(`[Security] ${event.type}: ${event.details}`);
  },

  getEvents: (startDate?: Date, endDate?: Date): SecurityEvent[] => {
    let filtered = SecurityEventLog.events;
    if (startDate) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((e) => new Date(e.timestamp) <= endDate);
    }
    return filtered;
  },

  getRecentEvents: (limit: number = 50): SecurityEvent[] => {
    return SecurityEventLog.events.slice(-limit);
  },

  // Detect suspicious patterns
  analyzeSuspiciousActivity: (userId: string): SecurityEvent[] => {
    const userEvents = SecurityEventLog.events.filter(
      (e) => e.userId === userId,
    );
    const recentFailures = userEvents.filter(
      (e) =>
        e.type === "FAILED_LOGIN" &&
        new Date(e.timestamp).getTime() > Date.now() - 3600000, // Last hour
    );

    if (recentFailures.length >= 5) {
      SecurityEventLog.log({
        type: "SUSPICIOUS_ACTIVITY",
        userId,
        userName: "Unknown",
        details: `Multiple failed login attempts detected: ${recentFailures.length} in the last hour`,
        severity: "HIGH",
      });
    }

    return recentFailures;
  },
};

// Activity Timeout Manager
export const ActivityTimeout = {
  timeoutId: null as NodeJS.Timeout | null,
  timeoutMinutes: 15,
  warningMinutes: 2,

  start: (onTimeout: () => void, onWarning: () => void): void => {
    if (typeof window === "undefined") return;

    // Clear existing timeout
    ActivityTimeout.stop();

    // Set warning timeout
    const warningMs = ActivityTimeout.warningMinutes * 60 * 1000;
    const timeoutMs = ActivityTimeout.timeoutMinutes * 60 * 1000;

    // Track user activity
    const resetTimeout = () => {
      if (ActivityTimeout.timeoutId) {
        clearTimeout(ActivityTimeout.timeoutId);
        ActivityTimeout.timeoutId = null;
        ActivityTimeout.start(onTimeout, onWarning);
      }
    };

    // Listen for activity
    window.addEventListener("mousemove", resetTimeout, { passive: true });
    window.addEventListener("keypress", resetTimeout, { passive: true });
    window.addEventListener("click", resetTimeout, { passive: true });

    // Set warning timeout
    setTimeout(() => {
      onWarning();
    }, warningMs);

    // Set actual timeout
    ActivityTimeout.timeoutId = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  },

  stop: (): void => {
    if (ActivityTimeout.timeoutId) {
      clearTimeout(ActivityTimeout.timeoutId);
      ActivityTimeout.timeoutId = null;
    }
  },

  extend: (minutes: number): void => {
    ActivityTimeout.timeoutMinutes = minutes;
  },
};

// Password Policy Enforcer
export const PasswordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventReuse: 5,

  validate: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < PasswordPolicy.minLength) {
      errors.push(
        `Password must be at least ${PasswordPolicy.minLength} characters`,
      );
    }
    if (PasswordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (PasswordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (PasswordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (
      PasswordPolicy.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push("Password must contain at least one special character");
    }

    // Check common passwords
    if (PasswordPolicy.preventCommonPasswords) {
      const common = ["password", "123456", "admin", "govfleet", "military"];
      if (common.some((p) => password.toLowerCase().includes(p))) {
        errors.push("Password is too common");
      }
    }

    return { valid: errors.length === 0, errors };
  },

  calculateStrength: (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  },
};

// Role-Based Access Control
export const RBAC = {
  roles: {
    SUPER_ADMIN: {
      permissions: ["*"],
      inherits: ["DISPATCHER", "AUDITOR"],
    },
    DISPATCHER: {
      permissions: [
        "trips:create",
        "trips:read",
        "trips:update",
        "vehicles:read",
        "vehicles:assign",
        "incidents:read",
        "incidents:update",
      ],
      inherits: [],
    },
    DRIVER: {
      permissions: [
        "trips:read",
        "trips:update",
        "incidents:create",
        "vehicles:read",
      ],
      inherits: [],
    },
    MECHANIC: {
      permissions: [
        "vehicles:read",
        "vehicles:maintenance",
        "work_orders:read",
        "work_orders:create",
      ],
      inherits: [],
    },
    AUDITOR: {
      permissions: [
        "trips:read",
        "vehicles:read",
        "incidents:read",
        "audit_logs:read",
      ],
      inherits: [],
    },
    RIDER: {
      permissions: ["requests:create", "requests:read"],
      inherits: [],
    },
  },

  hasPermission: (userRole: string, permission: string): boolean => {
    const role = RBAC.roles[userRole as keyof typeof RBAC.roles];
    if (!role) return false;

    if (role.permissions.includes("*")) return true;
    if (role.permissions.includes(permission)) return true;

    // Check inherited roles
    if (role.inherits) {
      return role.inherits.some((inheritedRole) =>
        RBAC.hasPermission(inheritedRole, permission),
      );
    }

    return false;
  },

  canAccessRoute: (userRole: string, route: string): boolean => {
    const routePermissions: Record<string, string[]> = {
      "/dashboard": ["SUPER_ADMIN", "DISPATCHER", "AUDITOR"],
      "/map": ["SUPER_ADMIN", "DISPATCHER", "DRIVER"],
      "/fleet": ["SUPER_ADMIN", "DISPATCHER", "MECHANIC"],
      "/missions": ["SUPER_ADMIN", "DISPATCHER"],
      "/personnel": ["SUPER_ADMIN", "DISPATCHER"],
      "/maintenance": ["SUPER_ADMIN", "MECHANIC"],
      "/statistics": ["SUPER_ADMIN", "DISPATCHER", "AUDITOR"],
      "/history": ["SUPER_ADMIN", "DISPATCHER", "AUDITOR"],
      "/settings": ["SUPER_ADMIN"],
    };

    const allowedRoles = routePermissions[route];
    if (!allowedRoles) return true;
    return allowedRoles.includes(userRole);
  },
};

export default {
  BiometricAuth,
  SessionRecorder,
  ComplianceExport,
  SecurityEventLog,
  ActivityTimeout,
  PasswordPolicy,
  RBAC,
};
