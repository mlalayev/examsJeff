import bcrypt from "bcryptjs";
import { encryptPassword } from "./password-vault";

/** Hash for login + encrypt for creator recovery vault. */
export async function preparePasswordForStorage(plainPassword: string): Promise<{
  passwordHash: string;
  passwordEncrypted: string;
}> {
  const passwordHash = await bcrypt.hash(plainPassword, 10);
  const passwordEncrypted = encryptPassword(plainPassword);
  return { passwordHash, passwordEncrypted };
}
