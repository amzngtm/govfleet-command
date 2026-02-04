/**
 * GovFleet Security Module
 * Government-grade security implementation for classified operations
 */

// Re-export all security utilities
export * from "./encryption";
export * from "./AuthContext";
export type { SanitizedResult } from "./sanitization";
export * from "./sanitization";
export * from "./auditLogger";
export * from "./securityHeaders";

// Security configuration
export const SECURITY_CONFIG = {
  version: "1.0.0",
  classification: "UNCLASSIFIED // FOUO",
  compliance: ["FIPS 140-2", "NIST 800-53", "CJIS"],
  sessionTimeoutMinutes: 15,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  requireMFA: false,
  auditRetentionDays: 90,
};

export type SecurityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function getSecurityLevel(roles: string[]): SecurityLevel {
  if (roles.includes("SUPER_ADMIN")) return "CRITICAL";
  if (roles.includes("DISPATCHER")) return "HIGH";
  if (roles.includes("DRIVER")) return "MEDIUM";
  return "LOW";
}

// Initialize all security measures - must be called once at app startup
export function initializeSecurity(): void {
  if (typeof document !== "undefined") {
    // Import and apply headers dynamically to avoid circular references
    import("./securityHeaders").then((module) => {
      module.applySecurityHeaders();
      console.log("[SECURITY] Government-grade security initialized");
      console.log("[SECURITY] Classification:", SECURITY_CONFIG.classification);
      console.log(
        "[SECURITY] Compliance:",
        SECURITY_CONFIG.compliance.join(", "),
      );
    });
  }
}
