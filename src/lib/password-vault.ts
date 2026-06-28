import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const KEY_SALT = "aimentor-password-vault-v1";

function getVaultKey(): Buffer {
  const secret = process.env.PASSWORD_VAULT_KEY || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("PASSWORD_VAULT_KEY or NEXTAUTH_SECRET is required for password vault");
  }
  return scryptSync(secret, KEY_SALT, 32);
}

/** Encrypt a plain password for creator-only recovery (AES-256-GCM). */
export function encryptPassword(plain: string): string {
  const key = getVaultKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString("base64")).join(".");
}

/** Decrypt a vaulted password. Returns null if invalid or tampered. */
export function decryptPassword(encrypted: string): string | null {
  try {
    const parts = encrypted.split(".");
    if (parts.length !== 3) return null;

    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const key = getVaultKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
