/**
 * CREATOR Account Initialization
 * This script ensures the CREATOR superadmin account exists in the database
 * It runs automatically on application startup
 */

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const CREATOR_EMAIL = "creator@creator.com";
const CREATOR_PASSWORD = "murad123";
const CREATOR_FIRST_NAME = "System";
const CREATOR_LAST_NAME = "Creator";

export async function initializeCreatorAccount() {
  try {
    // Check if creator account already exists
    const existingCreator = await prisma.user.findUnique({
      where: { email: CREATOR_EMAIL },
    });

    if (existingCreator) {
      // Creator account already exists

      // Ensure the creator has the CREATOR role and is approved
      if (existingCreator.role !== "CREATOR" || !existingCreator.approved) {
        await prisma.user.update({
          where: { email: CREATOR_EMAIL },
          data: {
            role: "CREATOR",
            approved: true,
          },
        });
      }
      
      return;
    }

    // Get or create a default branch for the creator
    let defaultBranch = await prisma.branch.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!defaultBranch) {
      defaultBranch = await prisma.branch.create({
        data: { name: "Main Branch" },
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(CREATOR_PASSWORD, 10);

    // Create the creator account
    await prisma.user.create({
      data: {
        firstName: CREATOR_FIRST_NAME,
        lastName: CREATOR_LAST_NAME,
        email: CREATOR_EMAIL,
        passwordHash,
        role: "CREATOR",
        approved: true,
        branchId: defaultBranch.id,
      },
    });
  } catch (error) {
    console.error("✗ Failed to initialize creator account:", error);
    // Don't throw - we don't want to prevent the app from starting
  }
}

