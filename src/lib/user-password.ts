import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
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

/** Persist login hash + creator vault for any password set/change. */
export async function updateUserPassword(
  db: Pick<PrismaClient, "user">,
  userId: string,
  plainPassword: string
): Promise<void> {
  const { passwordHash, passwordEncrypted } = await preparePasswordForStorage(plainPassword);
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, passwordEncrypted },
  });
}

/** Verify current password before self-service change. */
export async function verifyUserPassword(
  passwordHash: string,
  plainPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
