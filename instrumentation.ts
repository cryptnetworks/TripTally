import { logger } from "@/lib/logger";

const globalForInstrumentation = globalThis as typeof globalThis & {
  tripTallyInstrumentationStarted?: boolean;
};

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (!globalForInstrumentation.tripTallyInstrumentationStarted) {
    globalForInstrumentation.tripTallyInstrumentationStarted = true;
    logger.info("app.startup", {
      nodeEnv: process.env.NODE_ENV,
      nextRuntime: process.env.NEXT_RUNTIME
    });
  }
}
