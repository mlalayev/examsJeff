/**
 * Next.js Instrumentation - runs once on server startup
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { initializeCreatorAccount } from "./lib/init-creator";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Initialize the creator account on server startup
    await initializeCreatorAccount();
  }
}

