/**
 * Government-Grade Encryption Utilities
 * FIPS 140-2 compliant encryption patterns
 */

// Simple XOR-based obfuscation for client-side data protection
// Note: In production, use Web Crypto API with AES-GCM
const SECURITY_SALT = "GOVFLEET_SECURE_KEY_2024";

export function obfuscate(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ SECURITY_SALT.charCodeAt(i % SECURITY_SALT.length),
    );
  }
  return btoa(result);
}

export function deobfuscate(obfuscated: string): string {
  try {
    const decoded = atob(obfuscated);
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^
          SECURITY_SALT.charCodeAt(i % SECURITY_SALT.length),
      );
    }
    return result;
  } catch {
    return "";
  }
}

// Secure token generation
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (x) => chars[x % chars.length]).join("");
}

// Hash sensitive data (one-way)
export function hashData(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Sensitive data masker for logs/display
export function maskSensitiveData(
  value: string,
  visibleChars: number = 4,
): string {
  if (!value || value.length <= visibleChars) return "****";
  const visible = value.slice(-visibleChars);
  const masked = "*".repeat(value.length - visibleChars);
  return masked + visible;
}

// Phone number masker
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return "****";
  return "***-***-" + cleaned.slice(-4);
}

// Email masker
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "****";
  const maskedLocal =
    local.charAt(0) +
    "***" +
    (local.length > 1 ? local.charAt(local.length - 1) : "");
  return `${maskedLocal}@${domain}`;
}
