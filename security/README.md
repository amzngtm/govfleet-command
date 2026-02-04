# GovFleet Security Module

## Government-Grade Security Implementation

This module provides comprehensive security features compliant with FIPS 140-2, NIST 800-53, and CJIS standards.

## Module Overview

### 1. Encryption (`encryption.ts`)

```typescript
// Obfuscate sensitive data
const obfuscated = obfuscate("sensitive data");
const restored = deobfuscate(obfuscated);

// Generate secure tokens
const token = generateSecureToken(64);

// Hash passwords (one-way)
const hash = hashData("password123");

// Mask sensitive information
maskSensitiveData("12345678", 4); // "****5678"
maskPhoneNumber("555-123-4567"); // "***-***-4567"
maskEmail("john@example.mil"); // "j***n@example.mil"
```

### 2. Authentication (`AuthContext.tsx`)

```typescript
// Login with credentials
const { login, logout, isAuthenticated, user } = useAuth();

// Check permissions
const canAccess = checkPermission([UserRole.DISPATCHER, UserRole.SUPER_ADMIN]);

// Role hierarchy
const ROLE_HIERARCHY = {
  SUPER_ADMIN: 100,
  DISPATCHER: 80,
  AUDITOR: 60,
  DRIVER: 40,
  MECHANIC: 30,
  RIDER: 10,
};
```

### 3. Input Sanitization (`sanitization.ts`)

```typescript
// XSS and SQL injection protection
const result = sanitizeString(userInput);
if (!result.isValid) {
  console.error(result.errorMessage);
}

// Field-specific validation
sanitizeEmail("test@example.mil");
sanitizePhoneNumber("555-123-4567");
sanitizePlate("GOV-1234");
sanitizeVIN("1FM5K8F81GGA10001");
sanitizeCoordinate("45.5");

// Log sanitization (redacts sensitive data)
const safeLog = sanitizeForLogging({ password: "secret", name: "John" });
// { password: "***REDACTED***", name: "John" }
```

### 4. Audit Logging (`auditLogger.ts`)

```typescript
const { auditLogger } = useAuditLogger();

// Log security events
auditLogger.logLoginSuccess("userId");
auditLogger.logLoginFailure("userId", "Invalid password");
auditLogger.logRecordCreate("admin", "Vehicle", "v123", newVehicle);
auditLogger.logRecordModify("admin", "Vehicle", "v123", oldVehicle, newVehicle);
auditLogger.logRecordDelete("admin", "Vehicle", "v123");

// Query logs
const logs = auditLogger.getLogs();
const userLogs = auditLogger.getLogsByActor("userId");
const failures = auditLogger.getLogsByAction(AuditAction.LOGIN_FAILURE);
const critical = auditLogger.getCriticalLogs();

// Export logs
const jsonLogs = auditLogger.exportLogs("json");
const csvLogs = auditLogger.exportLogs("csv");
```

### 5. Security Headers (`securityHeaders.ts`)

```typescript
// Apply security headers
applySecurityHeaders();

// Rate limiting
const limiter = new RateLimiter(5, 60000); // 5 attempts per minute
const { allowed, remaining } = limiter.recordAttempt("userId");
if (!allowed) {
  console.log(`Retry after ${limiter.getRetryAfter()} seconds`);
}

// Timing-safe comparison
const isMatch = secureCompare(input, stored);

// Debounce function calls
const debouncedSave = debounce(saveData, 300);
```

## Security Configuration

```typescript
import { SECURITY_CONFIG, initializeSecurity } from "./security";

// Initialize all security measures on app startup
initializeSecurity();

console.log(SECURITY_CONFIG.classification); // "UNCLASSIFIED // FOUO"
console.log(SECURITY_CONFIG.compliance); // ["FIPS 140-2", "NIST 800-53", "CJIS"]
```

## HTTP Security Headers

The following headers are applied via Vite config and HTML meta tags:

| Header                       | Value                                | Purpose                            |
| ---------------------------- | ------------------------------------ | ---------------------------------- |
| Content-Security-Policy      | `default-src 'self'; ...`            | Prevents XSS and injection attacks |
| X-Content-Type-Options       | `nosniff`                            | Prevents MIME type sniffing        |
| X-Frame-Options              | `DENY`                               | Prevents clickjacking              |
| X-XSS-Protection             | `1; mode=block`                      | Legacy XSS protection              |
| Referrer-Policy              | `strict-origin-when-cross-origin`    | Privacy protection                 |
| Permissions-Policy           | `geolocation=(); microphone=(); ...` | Feature restrictions               |
| Cross-Origin-Opener-Policy   | `same-origin`                        | Isolates browsing context          |
| Cross-Origin-Resource-Policy | `same-origin`                        | Restricts cross-origin requests    |

## Session Security

- **Timeout**: 15 minutes of inactivity triggers auto-logout
- **Lockout**: 5 failed attempts = 30-minute lockout
- **Session Token**: Cryptographically secure 64-character token
- **Activity Tracking**: Mouse, keyboard, scroll, and touch events

## Usage in Components

```tsx
import { useAuth, useAuditLogger, validateFormField } from "./security";

function SensitiveForm() {
  const { user, checkPermission } = useAuth();
  const { logRecordCreate } = useAuditLogger();

  const handleSubmit = (data: FormData) => {
    // Validate input
    const emailResult = validateFormField(data.email, "email");
    if (!emailResult.isValid) {
      return { error: emailResult.errorMessage };
    }

    // Check permission
    if (!checkPermission([UserRole.DISPATCHER, UserRole.SUPER_ADMIN])) {
      return { error: "Insufficient permissions" };
    }

    // Log action
    logRecordCreate(user.id, "Request", data.id, data);

    return { success: true };
  };

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## Production Checklist

- [ ] HTTPS enabled (required for production)
- [ ] Session timeout configured (15 minutes default)
- [ ] Audit log retention configured (90 days)
- [ ] Rate limits appropriate for traffic
- [ ] Sensitive data redaction enabled
- [ ] CSP policies reviewed and tightened
- [ ] Access control roles configured
- [ ] Security headers applied
- [ ] Input validation on all forms
- [ ] XSS protection active
- [ ] SQL injection patterns blocked

## Testing

Run security tests:

```bash
npm test
```

Manual security audit:

```bash
import { runSecurityAudit } from "./security";
const audit = runSecurityAudit();
console.log(audit.issues);
console.log(audit.recommendations);
```

## Compliance

This implementation follows:

- **FIPS 140-2**: Cryptographic module standards
- **NIST 800-53**: Security and privacy controls
- **CJIS**: Criminal Justice Information Services policy

## License

Internal use only - Government/Critical Infrastructure
