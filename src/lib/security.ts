/**
 * Production Security Middleware
 * Centralized security utilities for Next.js API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * Validate environment variables on startup
 */
export function validateRequiredEnvVars(): void {
  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "CRON_SECRET",
  ];

  const missing: string[] = [];
  
  for (const varName of required) {
    if (!process.env[varName] || process.env[varName]?.includes("CHANGE_ME")) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `SECURITY ERROR: Missing or invalid required environment variables: ${missing.join(", ")}\n` +
      `Please check your .env file and ensure all required variables are set with strong values.`
    );
  }

  // Check NEXTAUTH_SECRET strength
  const secret = process.env.NEXTAUTH_SECRET || "";
  if (secret.length < 32) {
    throw new Error(
      "SECURITY ERROR: NEXTAUTH_SECRET must be at least 32 characters long. " +
      "Generate a strong secret using: openssl rand -base64 32"
    );
  }

  // Check CRON_SECRET strength
  const cronSecret = process.env.CRON_SECRET || "";
  if (cronSecret.length < 32 || cronSecret === process.env.NEXTAUTH_SECRET) {
    throw new Error(
      "SECURITY ERROR: CRON_SECRET must be at least 32 characters long and different from NEXTAUTH_SECRET. " +
      "Generate a strong secret using: openssl rand -base64 32"
    );
  }
}

/**
 * Validate request body size
 */
export function validateBodySize(
  body: any,
  maxSizeBytes: number = parseInt(process.env.MAX_JSON_BODY_SIZE || "1048576")
): { valid: boolean; error?: string } {
  const bodyStr = JSON.stringify(body);
  const sizeBytes = Buffer.byteLength(bodyStr, "utf8");

  if (sizeBytes > maxSizeBytes) {
    return {
      valid: false,
      error: `Request body too large: ${sizeBytes} bytes (max: ${maxSizeBytes} bytes)`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize error messages for production
 * Prevents leaking sensitive information to clients
 */
export function sanitizeError(error: unknown): {
  message: string;
  status: number;
} {
  // Log full error server-side
  if (process.env.LOG_LEVEL === "debug") {
    console.error("Error details:", error);
  }

  // Return safe message to client
  if (error instanceof Error) {
    // Known safe error messages
    const safeMessages = [
      "Unauthorized",
      "Forbidden",
      "Not found",
      "Invalid input",
      "Too many requests",
      "Service unavailable",
    ];

    const message = error.message;
    
    // Check if message is safe to expose
    if (safeMessages.some((safe) => message.toLowerCase().includes(safe.toLowerCase()))) {
      if (message.includes("Unauthorized")) return { message: "Unauthorized", status: 401 };
      if (message.includes("Forbidden")) return { message: "Forbidden", status: 403 };
      if (message.includes("Not found")) return { message: "Not found", status: 404 };
      return { message, status: 400 };
    }
  }

  // Default safe message
  return {
    message: "An error occurred while processing your request",
    status: 500,
  };
}

/**
 * Safe error response wrapper
 */
export function createErrorResponse(
  error: unknown,
  defaultStatus: number = 500
): NextResponse {
  const sanitized = sanitizeError(error);
  
  // Log error with context (production logging)
  if (process.env.NODE_ENV === "production" && process.env.LOG_LEVEL !== "debug") {
    // Only log error type and safe message in production
    console.error(`API Error [${sanitized.status}]:`, sanitized.message);
  } else {
    // Full error in development
    console.error("API Error:", error);
  }

  return NextResponse.json(
    { error: sanitized.message },
    { status: sanitized.status || defaultStatus }
  );
}

/**
 * Validate and sanitize user input using Zod
 */
export function validateInput<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join(".")}: ${firstError.message}`,
      };
    }
    return { success: false, error: "Invalid input" };
  }
}

/**
 * Check CRON endpoint authorization
 */
export function validateCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    return false;
  }

  // Optional: Check IP whitelist
  const allowedIps = process.env.CRON_ALLOWED_IPS?.split(",").map((ip) => ip.trim());
  if (allowedIps && allowedIps.length > 0) {
    const clientIp = getClientIp(request);
    if (!allowedIps.includes(clientIp)) {
      console.warn(`CRON: Unauthorized IP attempt: ${clientIp}`);
      return false;
    }
  }

  return true;
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  
  // Check common proxy headers
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;
  
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  
  return "unknown";
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large: ${file.size} bytes (max: ${maxSizeBytes} bytes)`,
    };
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !allowedTypes.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
    };
  }

  // Check MIME type
  const mimeType = file.type;
  const validMimeTypes: Record<string, string[]> = {
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/flac", "audio/webm"],
    image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  };

  let mimeTypeValid = false;
  for (const types of Object.values(validMimeTypes)) {
    if (types.some((type) => mimeType.startsWith(type.split("/")[0]))) {
      mimeTypeValid = true;
      break;
    }
  }

  if (!mimeTypeValid) {
    return {
      valid: false,
      error: `Invalid MIME type: ${mimeType}`,
    };
  }

  return { valid: true };
}

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(data: any): any {
  if (process.env.LOG_MASK_SENSITIVE !== "true") {
    return data;
  }

  const sensitiveKeys = [
    "password",
    "passwordHash",
    "token",
    "secret",
    "apiKey",
    "authorization",
    "cookie",
    "session",
  ];

  if (typeof data === "object" && data !== null) {
    const masked = { ...data };
    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        masked[key] = "***REDACTED***";
      } else if (typeof masked[key] === "object") {
        masked[key] = maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }

  return data;
}

/**
 * Check if maintenance mode is enabled
 */
export function isMaintenanceMode(): boolean {
  return process.env.MAINTENANCE_MODE === "true";
}

/**
 * Create maintenance mode response
 */
export function createMaintenanceResponse(): NextResponse {
  return NextResponse.json(
    {
      error: "Service temporarily unavailable",
      message: "The platform is currently under maintenance. Please try again later.",
    },
    {
      status: 503,
      headers: {
        "Retry-After": "3600", // 1 hour
      },
    }
  );
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

/**
 * Validate session/JWT age to prevent token replay
 */
export function isSessionFresh(
  issuedAt: number,
  maxAgeSeconds: number = 86400
): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - issuedAt < maxAgeSeconds;
}
