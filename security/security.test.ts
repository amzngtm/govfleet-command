/**
 * GovFleet Security Module Tests
 * Government-grade security validation tests
 */

import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizePlate,
  sanitizeVIN,
  sanitizeCoordinate,
  sanitizeForDisplay,
  stripHTML,
  validateLength,
  validateFormField,
  sanitizeForLogging,
  SanitizedResult,
} from "./sanitization";
import {
  encryptData,
  decryptData,
  generateSecureToken,
  hashData,
  maskSensitiveData,
  maskPhoneNumber,
  maskEmail,
} from "./encryption";
import { auditLogger, AuditAction, AuditSeverity } from "./auditLogger";
import { RateLimiter, secureCompare, debounce } from "./securityHeaders";

// ==================== SANITIZATION TESTS ====================

describe("sanitizeString", () => {
  it("should detect XSS attacks", () => {
    const result = sanitizeString("<script>alert('xss')</script>");
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain("XSS");
  });

  it("should detect javascript protocol", () => {
    const result = sanitizeString("javascript:alert('xss')");
    expect(result.isValid).toBe(false);
  });

  it("should sanitize valid input", () => {
    const result = sanitizeString("Hello <World>");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toContain("<");
  });
});

describe("sanitizeEmail", () => {
  it("should accept valid email", () => {
    const result = sanitizeEmail("test@example.mil");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("test@example.mil");
  });

  it("should reject invalid email", () => {
    const result = sanitizeEmail("not-an-email");
    expect(result.isValid).toBe(false);
  });
});

describe("sanitizePhoneNumber", () => {
  it("should accept valid phone", () => {
    const result = sanitizePhoneNumber("555-123-4567");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("5551234567");
  });

  it("should reject too short phone", () => {
    const result = sanitizePhoneNumber("123");
    expect(result.isValid).toBe(false);
  });
});

describe("sanitizePlate", () => {
  it("should accept valid plate", () => {
    const result = sanitizePlate("GOV-1234");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("GOV-1234");
  });

  it("should reject invalid plate", () => {
    const result = sanitizePlate("X");
    expect(result.isValid).toBe(false);
  });
});

describe("sanitizeVIN", () => {
  it("should accept valid VIN", () => {
    const vin = "1FM5K8F81GGA10001";
    const result = sanitizeVIN(vin);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(vin);
  });

  it("should reject invalid VIN length", () => {
    const result = sanitizeVIN("ABC123");
    expect(result.isValid).toBe(false);
  });
});

describe("sanitizeCoordinate", () => {
  it("should accept valid coordinate", () => {
    const result = sanitizeCoordinate("45.5");
    expect(result.isValid).toBe(true);
  });

  it("should reject invalid coordinate", () => {
    const result = sanitizeCoordinate("not-a-number");
    expect(result.isValid).toBe(false);
  });
});

describe("sanitizeForDisplay", () => {
  it("should escape HTML entities", () => {
    const result = sanitizeForDisplay("<script>");
    expect(result).toContain("<");
  });
});

describe("stripHTML", () => {
  it("should remove HTML tags", () => {
    const result = stripHTML("<p>Hello</p>");
    expect(result).toBe("Hello");
  });
});

describe("validateLength", () => {
  it("should accept valid length", () => {
    const result = validateLength("hello", 1, 10);
    expect(result.isValid).toBe(true);
  });

  it("should reject too short", () => {
    const result = validateLength("", 1, 10);
    expect(result.isValid).toBe(false);
  });

  it("should truncate too long", () => {
    const result = validateLength("hello world", 0, 5);
    expect(result.isValid).toBe(false);
    expect(result.sanitizedValue).toBe("hello");
  });
});

describe("validateFormField", () => {
  it("should validate email field", () => {
    const result = validateFormField("test@test.mil", "email");
    expect(result.isValid).toBe(true);
  });

  it("should validate password field", () => {
    const result = validateFormField("short", "password");
    expect(result.isValid).toBe(false);
  });

  it("should validate plate field", () => {
    const result = validateFormField("GOV-123", "plate");
    expect(result.isValid).toBe(true);
  });
});

describe("sanitizeForLogging", () => {
  it("should redact sensitive fields", () => {
    const obj = { name: "John", password: "secret123", token: "abc" };
    const result = sanitizeForLogging(obj);
    expect(result.name).toBe("John");
    expect(result.password).toBe("***REDACTED***");
    expect(result.token).toBe("***REDACTED***");
  });
});

// ==================== ENCRYPTION TESTS ====================

describe("encryptData/decryptData", () => {
  it("should encrypt and decrypt data", async () => {
    const original = "sensitive data";
    const encrypted = await encryptData(original);
    const decrypted = await decryptData(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should produce different output for same input", async () => {
    const one = await encryptData("test");
    const two = await encryptData("test");
    expect(one).not.toBe(two); // Should use random IV
  });
});

describe("generateSecureToken", () => {
  it("should generate token of specified length", () => {
    const token = generateSecureToken(32);
    expect(token.length).toBe(32);
  });

  it("should generate alphanumeric tokens", () => {
    const token = generateSecureToken(64);
    expect(token).toMatch(/^[a-zA-Z0-9]+$/);
  });
});

describe("hashData", () => {
  it("should produce consistent hash", () => {
    const hash1 = hashData("test");
    const hash2 = hashData("test");
    expect(hash1).toBe(hash2);
  });

  it("should produce different hash for different input", () => {
    const hash1 = hashData("test1");
    const hash2 = hashData("test2");
    expect(hash1).not.toBe(hash2);
  });
});

describe("maskSensitiveData", () => {
  it("should mask data with visible suffix", () => {
    const result = maskSensitiveData("12345678", 4);
    expect(result).toBe("****5678");
  });

  it("should mask short data", () => {
    const result = maskSensitiveData("123", 4);
    expect(result).toBe("****");
  });
});

describe("maskPhoneNumber", () => {
  it("should mask phone number", () => {
    const result = maskPhoneNumber("555-123-4567");
    expect(result).toBe("***-***-4567");
  });
});

describe("maskEmail", () => {
  it("should mask email address", () => {
    const result = maskEmail("john.doe@example.mil");
    expect(result).toContain("@example.mil");
    expect(result).not.toContain("john");
  });
});

// ==================== AUDIT LOGGER TESTS ====================

describe("auditLogger", () => {
  beforeEach(() => {
    auditLogger.clearLogs();
  });

  it("should log events", () => {
    const log = auditLogger.logLoginSuccess("user123");
    expect(log.id).toBeDefined();
    expect(log.action).toBe(AuditAction.LOGIN_SUCCESS);
  });

  it("should filter logs by actor", () => {
    auditLogger.logLoginSuccess("user1");
    auditLogger.logLoginSuccess("user2");
    const user1Logs = auditLogger.getLogsByActor("user1");
    expect(user1Logs.length).toBe(1);
  });

  it("should filter logs by action", () => {
    auditLogger.logLoginSuccess("user1");
    auditLogger.logLoginFailure("user1", "bad password");
    const failures = auditLogger.getLogsByAction(AuditAction.LOGIN_FAILURE);
    expect(failures.length).toBe(1);
  });

  it("should get recent logs", () => {
    for (let i = 0; i < 10; i++) {
      auditLogger.logLoginSuccess("user" + i);
    }
    const recent = auditLogger.getRecentLogs(5);
    expect(recent.length).toBe(5);
  });

  it("should export logs as JSON", () => {
    auditLogger.logLoginSuccess("user1");
    const json = auditLogger.exportLogs("json");
    expect(json).toContain("LOGIN_SUCCESS");
  });
});

// ==================== SECURITY UTILITY TESTS ====================

describe("RateLimiter", () => {
  it("should allow requests within limit", () => {
    const limiter = new RateLimiter(3, 60000);
    const result = limiter.recordAttempt("test");
    expect(result.allowed).toBe(true);
  });

  it("should block requests exceeding limit", () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.recordAttempt("test");
    limiter.recordAttempt("test");
    const result = limiter.recordAttempt("test");
    expect(result.allowed).toBe(false);
  });

  it("should reset correctly", () => {
    const limiter = new RateLimiter(1, 60000);
    limiter.recordAttempt("test");
    limiter.reset("test");
    const result = limiter.recordAttempt("test");
    expect(result.allowed).toBe(true);
  });
});

describe("secureCompare", () => {
  it("should return true for matching strings", () => {
    expect(secureCompare("test", "test")).toBe(true);
  });

  it("should return false for non-matching strings", () => {
    expect(secureCompare("test", "Test")).toBe(false);
  });

  it("should return false for different length strings", () => {
    expect(secureCompare("test", "testing")).toBe(false);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should delay function execution", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    debouncedFn();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous calls", () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    debouncedFn();
    debouncedFn();
    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

// ==================== RUN TESTS ====================

// In a real project, run with: npm test
// This file documents all security test cases for production readiness
