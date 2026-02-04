/**
 * Security Headers Configuration
 * Implements HTTP security headers for government-grade protection
 */

// Content Security Policy - strict configuration for government applications
export const CSP_POLICY = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "https://esm.sh"],
  "style-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
  "img-src": ["'self'", "data:", "https:", "https://i.pravatar.cc"],
  "connect-src": [
    "'self'",
    "https://api.gemini.googleapis.com",
    "https://*.gemini.googleapis.com",
  ],
  "font-src": ["'self'", "data:", "https://fonts.googleapis.com"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "script-src-attr": ["'none'"],
  "upgrade-insecure-requests": [],
};

// Security headers to apply
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Content-Security-Policy": Object.entries(CSP_POLICY)
    .map(([key, values]) => {
      const directive = values.length > 0 ? values.join(" ") : "";
      return directive ? `${key} ${directive}` : key;
    })
    .join("; "),
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": [
    "geolocation=()",
    "microphone=()",
    "camera=()",
    "payment=()",
    "usb=()",
    "vr=()",
  ].join(", "),
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

// Apply security headers to document
export function applySecurityHeaders(): void {
  if (typeof document === "undefined") return;

  const hasXContentType = document.querySelector(
    'meta[name="x-content-type-options"]',
  );
  if (!hasXContentType) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "x-content-type-options");
    meta.setAttribute("content", "nosniff");
    document.head.appendChild(meta);
  }

  const hasReferrer = document.querySelector('meta[name="referrer"]');
  if (!hasReferrer) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "referrer");
    meta.setAttribute("content", "strict-origin-when-cross-origin");
    document.head.appendChild(meta);
  }
}

// Security audit function
export function runSecurityAudit(): {
  passed: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (typeof window !== "undefined") {
    if (
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      issues.push("Application is not using HTTPS");
      recommendations.push("Enable HTTPS for production deployments");
    }
  }

  return {
    passed: issues.length === 0,
    issues,
    recommendations,
  };
}

// Disable right-click context menu in sensitive areas (optional)
export function disableContextMenu(selector?: string): () => void {
  const handler = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  if (selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => el.addEventListener("contextmenu", handler));

    return () => {
      elements.forEach((el) => el.removeEventListener("contextmenu", handler));
    };
  } else {
    document.addEventListener("contextmenu", handler);

    return () => {
      document.removeEventListener("contextmenu", handler);
    };
  }
}

// Disable keyboard shortcuts that could be used for XSS
export function disableDevShortcuts(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      return false;
    }
    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }
  };

  document.addEventListener("keydown", handler);

  return () => {
    document.removeEventListener("keydown", handler);
  };
}

// Secure random ID generation
export function generateSecureId(prefix: string = "id"): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return prefix + "_" + hex.substring(0, 16);
}

// Timing-safe string comparison (prevents timing attacks)
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// Debounce function to prevent rapid-fire requests
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Rate limiter for sensitive operations
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return false;
    }

    if (now > record.resetTime) {
      this.attempts.delete(key);
      return false;
    }

    return record.count >= this.maxAttempts;
  }

  recordAttempt(key: string): {
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    let record = this.attempts.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + this.windowMs };
      this.attempts.set(key, record);
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }

    record.count++;
    const remaining = Math.max(0, this.maxAttempts - record.count);

    if (record.count >= this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      };
    }

    return { allowed: true, remaining };
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  resetAll(): void {
    this.attempts.clear();
  }
}

// Security event types for monitoring
export enum SecurityEventType {
  FAILED_LOGIN = "FAILED_LOGIN",
  SUCCESSFUL_LOGIN = "SUCCESSFUL_LOGIN",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",
  SENSITIVE_DATA_ACCESS = "SENSITIVE_DATA_ACCESS",
  EXPORT_DATA = "EXPORT_DATA",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

// Log security events
export function logSecurityEvent(
  type: SecurityEventType,
  details: Record<string, unknown>,
): void {
  const event = {
    type,
    timestamp: new Date().toISOString(),
    details,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  };

  console.warn("[SECURITY EVENT]", SecurityEventType[type], event);
}
