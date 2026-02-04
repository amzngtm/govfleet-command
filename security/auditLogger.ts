/**
 * Government-Grade Audit Logging System
 * FIPS 199 compliant audit trail implementation
 */

import { AuditLogEntry } from "../types";
import { sanitizeForLogging } from "./sanitization";

export enum AuditAction {
  // Authentication
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  SESSION_TIMEOUT = "SESSION_TIMEOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  ACCOUNT_LOCKOUT = "ACCOUNT_LOCKOUT",

  // Data Access
  VIEW_RECORD = "VIEW_RECORD",
  EXPORT_DATA = "EXPORT_DATA",
  PRINT_RECORD = "PRINT_RECORD",

  // Data Modification
  CREATE_RECORD = "CREATE_RECORD",
  MODIFY_RECORD = "MODIFY_RECORD",
  DELETE_RECORD = "DELETE_RECORD",
  BULK_UPDATE = "BULK_UPDATE",

  // System
  SYSTEM_STARTUP = "SYSTEM_STARTUP",
  SYSTEM_SHUTDOWN = "SYSTEM_SHUTDOWN",
  CONFIG_CHANGE = "CONFIG_CHANGE",
  PERMISSION_CHANGE = "PERMISSION_CHANGE",

  // Security Events
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  XSS_DETECTED = "XSS_DETECTED",
  SQL_INJECTION_DETECTED = "SQL_INJECTION_DETECTED",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ALERT = "ALERT",
  CRITICAL = "CRITICAL",
}

export interface EnhancedAuditLogEntry extends AuditLogEntry {
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

interface AuditLoggerConfig {
  enableConsole: boolean;
  enableStorage: boolean;
  maxStoredEntries: number;
  sensitiveFields: string[];
}

const defaultConfig: AuditLoggerConfig = {
  enableConsole: true,
  enableStorage: true,
  maxStoredEntries: 1000,
  sensitiveFields: ["password", "token", "ssn", "phone", "email", "address"],
};

class AuditLogger {
  private config: AuditLoggerConfig;
  private logs: EnhancedAuditLogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  private generateSessionId(): string {
    return (
      "sess_" +
      Date.now().toString(36) +
      Math.random().toString(36).substr(2, 9)
    );
  }

  private loadFromStorage(): void {
    if (this.config.enableStorage) {
      try {
        const stored = localStorage.getItem("govfleet_audit_logs");
        if (stored) {
          this.logs = JSON.parse(stored);
          // Trim to max entries
          if (this.logs.length > this.config.maxStoredEntries) {
            this.logs = this.logs.slice(-this.config.maxStoredEntries);
          }
        }
      } catch (e) {
        console.error("Failed to load audit logs from storage:", e);
      }
    }
  }

  private saveToStorage(): void {
    if (this.config.enableStorage) {
      try {
        localStorage.setItem("govfleet_audit_logs", JSON.stringify(this.logs));
      } catch (e) {
        console.error("Failed to save audit logs to storage:", e);
      }
    }
  }

  private getClientInfo(): { ipAddress?: string; userAgent?: string } {
    // In a real application, IP would come from the server
    return {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    };
  }

  log(
    action: AuditAction,
    details: string,
    actorId: string,
    options: {
      entityId?: string;
      severity?: AuditSeverity;
      previousValue?: unknown;
      newValue?: unknown;
      metadata?: Record<string, unknown>;
    } = {},
  ): EnhancedAuditLogEntry {
    const entry: EnhancedAuditLogEntry = {
      id:
        "audit_" +
        Date.now().toString(36) +
        Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      actorId,
      action,
      details,
      entityId: options.entityId,
      severity: options.severity || this.getSeverityForAction(action),
      sessionId: this.sessionId,
      ...this.getClientInfo(),
      previousValue: options.previousValue
        ? JSON.stringify(
            sanitizeForLogging(
              options.previousValue as Record<string, unknown>,
              this.config.sensitiveFields,
            ),
          )
        : undefined,
      newValue: options.newValue
        ? JSON.stringify(
            sanitizeForLogging(
              options.newValue as Record<string, unknown>,
              this.config.sensitiveFields,
            ),
          )
        : undefined,
      metadata: options.metadata,
    };

    this.logs.push(entry);

    // Keep only the most recent entries
    if (this.logs.length > this.config.maxStoredEntries) {
      this.logs = this.logs.slice(-this.config.maxStoredEntries);
    }

    this.saveToStorage();

    if (this.config.enableConsole) {
      const logMethod =
        entry.severity === AuditSeverity.CRITICAL ||
        entry.severity === AuditSeverity.ALERT
          ? "error"
          : entry.severity === AuditSeverity.WARNING
            ? "warn"
            : "log";
      console[logMethod](`[AUDIT ${entry.severity}] ${action}:`, {
        id: entry.id,
        timestamp: entry.timestamp,
        actor: actorId,
        details: entry.details,
        entity: entry.entityId,
      });
    }

    return entry;
  }

  private getSeverityForAction(action: AuditAction): AuditSeverity {
    const criticalActions = [
      AuditAction.UNAUTHORIZED_ACCESS,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.XSS_DETECTED,
      AuditAction.SQL_INJECTION_DETECTED,
      AuditAction.ACCOUNT_LOCKOUT,
    ];

    const warningActions = [
      AuditAction.LOGIN_FAILURE,
      AuditAction.DELETE_RECORD,
      AuditAction.PERMISSION_CHANGE,
      AuditAction.CONFIG_CHANGE,
      AuditAction.SESSION_TIMEOUT,
    ];

    if (criticalActions.includes(action)) {
      return AuditSeverity.CRITICAL;
    }
    if (warningActions.includes(action)) {
      return AuditSeverity.WARNING;
    }
    return AuditSeverity.INFO;
  }

  // Convenience methods for common audit events
  logLoginSuccess(userId: string): EnhancedAuditLogEntry {
    return this.log(
      AuditAction.LOGIN_SUCCESS,
      "User logged in successfully",
      userId,
      {
        severity: AuditSeverity.INFO,
      },
    );
  }

  logLoginFailure(userId: string, reason: string): EnhancedAuditLogEntry {
    return this.log(
      AuditAction.LOGIN_FAILURE,
      "Login failed: " + reason,
      userId,
      {
        severity: AuditSeverity.WARNING,
      },
    );
  }

  logLogout(userId: string): EnhancedAuditLogEntry {
    return this.log(AuditAction.LOGOUT, "User logged out", userId, {
      severity: AuditSeverity.INFO,
    });
  }

  logRecordView(
    actorId: string,
    entityType: string,
    entityId: string,
  ): EnhancedAuditLogEntry {
    return this.log(
      AuditAction.VIEW_RECORD,
      "Viewed " + entityType + " record",
      actorId,
      {
        entityId,
        severity: AuditSeverity.INFO,
      },
    );
  }

  logRecordCreate(
    actorId: string,
    entityType: string,
    entityId: string,
    newValue: unknown,
  ): EnhancedAuditLogEntry {
    return this.log(
      AuditAction.CREATE_RECORD,
      "Created " + entityType + " record",
      actorId,
      {
        entityId,
        newValue,
        severity: AuditSeverity.INFO,
      },
    );
  }

  logRecordModify(
    actorId: string,
    entityType: string,
    entityId: string,
    previousValue: unknown,
    newValue: unknown,
  ): EnhancedAuditLogEntry {
    return this.log(
      AuditAction.MODIFY_RECORD,
      "Modified " + entityType + " record",
      actorId,
      {
        entityId,
        previousValue,
        newValue,
        severity: AuditSeverity.INFO,
      },
    );
  }

  logRecordDelete(
    actorId: string,
    entityType: string,
    entityId: string,
  ): EnhancedAuditLogEntry {
    return this.log(
      AuditAction.DELETE_RECORD,
      "Deleted " + entityType + " record",
      actorId,
      {
        entityId,
        severity: AuditSeverity.WARNING,
      },
    );
  }

  logSecurityEvent(
    action: AuditAction,
    description: string,
    actorId: string,
  ): EnhancedAuditLogEntry {
    return this.log(action, description, actorId, {
      severity: AuditSeverity.CRITICAL,
      metadata: { securityEvent: true },
    });
  }

  // Query methods
  getLogs(): EnhancedAuditLogEntry[] {
    return [...this.logs];
  }

  getLogsByActor(actorId: string): EnhancedAuditLogEntry[] {
    return this.logs.filter((log) => log.actorId === actorId);
  }

  getLogsByAction(action: AuditAction): EnhancedAuditLogEntry[] {
    return this.logs.filter((log) => log.action === action);
  }

  getLogsBySeverity(severity: AuditSeverity): EnhancedAuditLogEntry[] {
    return this.logs.filter((log) => log.severity === severity);
  }

  getLogsInTimeRange(startTime: Date, endTime: Date): EnhancedAuditLogEntry[] {
    const start = startTime.getTime();
    const end = endTime.getTime();
    return this.logs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= start && logTime <= end;
    });
  }

  getRecentLogs(count: number = 50): EnhancedAuditLogEntry[] {
    return this.logs.slice(-count);
  }

  getCriticalLogs(): EnhancedAuditLogEntry[] {
    return this.logs.filter(
      (log) =>
        log.severity === AuditSeverity.CRITICAL ||
        log.severity === AuditSeverity.ALERT,
    );
  }

  clearLogs(): void {
    this.logs = [];
    this.saveToStorage();
    console.log("[AUDIT] All audit logs cleared");
  }

  exportLogs(format: "json" | "csv" = "json"): string {
    if (format === "csv") {
      const headers = [
        "ID",
        "Timestamp",
        "Actor",
        "Action",
        "Details",
        "Severity",
        "Entity ID",
      ];
      const rows = this.logs.map((log) => [
        log.id,
        log.timestamp,
        log.actorId,
        log.action,
        log.details,
        log.severity,
        log.entityId || "",
      ]);
      return [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n",
      );
    }
    return JSON.stringify(this.logs, null, 2);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  startNewSession(): string {
    this.sessionId = this.generateSessionId();
    return this.sessionId;
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// React hook for using audit logger in components
export const useAuditLogger = () => {
  return auditLogger;
};
