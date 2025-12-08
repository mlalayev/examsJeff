/**
 * CREATOR Account Initialization
 * This script ensures the CREATOR superadmin account exists in the database
 * It runs automatically on application startup
 */

import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const CREATOR_EMAIL = "creator@creator.com";
const CREATOR_PASSWORD = "murad123";
const CREATOR_NAME = "System Creator";

export async function initializeCreatorAccount() {
  try {
    // Check if creator account already exists
    const existingCreator = await prisma.user.findUnique({
      where: { email: CREATOR_EMAIL },
    });

    if (existingCreator) {
      // Creator account already exists
      console.log("✓ Creator account already exists");
      
      // Ensure the creator has the CREATOR role and is approved
      if (existingCreator.role !== "CREATOR" || !existingCreator.approved) {
        await prisma.user.update({
          where: { email: CREATOR_EMAIL },
          data: {
            role: "CREATOR",
            approved: true,
          },
        });
        console.log("✓ Creator account updated with CREATOR role");
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
      console.log("✓ Created default branch");
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(CREATOR_PASSWORD, 10);

    // Create the creator account
    await prisma.user.create({
      data: {
        name: CREATOR_NAME,
        email: CREATOR_EMAIL,
        passwordHash,
        role: "CREATOR",
        approved: true,
        branchId: defaultBranch.id,
      },
    });

    console.log("✓ Creator account created successfully");
    console.log(`  Email: ${CREATOR_EMAIL}`);
    console.log(`  Password: ${CREATOR_PASSWORD}`);
    console.log("  Role: CREATOR (superadmin with full access)");
    console.log("  Note: This account is hidden from all users");
  } catch (error) {
    console.error("✗ Failed to initialize creator account:", error);
    // Don't throw - we don't want to prevent the app from starting
  }
}

