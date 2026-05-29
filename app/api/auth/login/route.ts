import { NextResponse } from "next/server";
import * as bcrypt from "bcryptjs";
import { apiError } from "@/lib/api-response";
import { createSessionLoginToken } from "@/lib/login-token";
import { isSameOriginRequest } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAuthSettings } from "@/lib/settings";
import {
  startEmailTwoFactorChallenge,
  verifyAuthenticatorCode,
  verifyEmailTwoFactorCode
} from "@/lib/two-factor";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

function authResult(data: Record<string, unknown>) {
  return NextResponse.json(data);
}

function authFailure(error: string, extra: Record<string, unknown> = {}) {
  return authResult({
    ok: false,
    error,
    ...extra
  });
}

function logLoginDebug(fields: {
  email?: string;
  userId?: string;
  userFound?: boolean;
  passwordVerified?: boolean;
  mfaRequired?: boolean;
  stepFailed?: string;
}) {
  if (process.env.NODE_ENV !== "development") return;
  logger.info("auth.login.debug", fields);
}

async function handleLogin(request: Request) {
  if (!isSameOriginRequest(request.headers)) {
    logger.warn("auth.login_api.csrf_blocked");
    return apiError("FORBIDDEN", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.warn("auth.login_api.invalid_json");
    return authFailure("INVALID_CREDENTIALS");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success || !parsed.data.password) {
    logger.warn("auth.login_api.validation_failed");
    return authFailure("INVALID_CREDENTIALS");
  }

  const { email, password, twoFactorCode } = parsed.data;
  const settings = await getAuthSettings();
  if (!settings.localAuthEnabled) {
    logger.warn("auth.login.local_disabled", { email });
    logLoginDebug({ email, stepFailed: "local_auth_disabled" });
    return authFailure("INVALID_CREDENTIALS");
  }

  const rateLimit = checkRateLimit(`login:${email}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000
  });
  if (!rateLimit.allowed) {
    logger.warn("auth.login.rate_limited", { email });
    logLoginDebug({ email, stepFailed: "rate_limited" });
    return authFailure("INVALID_CREDENTIALS");
  }

  const user = await prisma.user.findUnique({ where: { email } });
  logLoginDebug({ email, userFound: Boolean(user) });
  if (!user) {
    logger.warn("auth.login.unknown_user", { email });
    logLoginDebug({ email, stepFailed: "unknown_user" });
    return authFailure("INVALID_CREDENTIALS");
  }

  if (user.disabledAt) {
    logger.warn("auth.login.disabled_user", { email, userId: user.id });
    logLoginDebug({ email, userId: user.id, stepFailed: "disabled_user" });
    return authFailure("INVALID_CREDENTIALS");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  logLoginDebug({ email, userId: user.id, passwordVerified: isValid });
  if (!isValid) {
    logger.warn("auth.login.invalid_password", { email, userId: user.id });
    logLoginDebug({ email, userId: user.id, stepFailed: "invalid_password" });
    return authFailure("INVALID_CREDENTIALS");
  }

  if (!user.emailVerifiedAt) {
    logger.warn("auth.login.email_unverified", { email, userId: user.id });
    logLoginDebug({ email, userId: user.id, stepFailed: "email_unverified" });
    return authFailure("EMAIL_VERIFICATION_REQUIRED");
  }

  if (user.twoFactorMethod === "email") {
    logLoginDebug({ email, userId: user.id, mfaRequired: true });
    if (!twoFactorCode) {
      await startEmailTwoFactorChallenge(user);
      logLoginDebug({ email, userId: user.id, stepFailed: "email_mfa_required" });
      return authFailure("MFA_REQUIRED", { method: "email" });
    }

    if (!(await verifyEmailTwoFactorCode(user.id, twoFactorCode))) {
      logLoginDebug({ email, userId: user.id, stepFailed: "invalid_email_mfa_code" });
      return authFailure("INVALID_MFA_CODE");
    }
  }

  if (user.twoFactorMethod === "authenticator") {
    logLoginDebug({ email, userId: user.id, mfaRequired: true });
    if (!user.authenticatorEnabled || !user.authenticatorSecretEncrypted) {
      logger.error("auth.login.mfa_misconfigured", {
        email,
        userId: user.id,
        method: user.twoFactorMethod,
        authenticatorEnabled: user.authenticatorEnabled
      });
      logLoginDebug({ email, userId: user.id, stepFailed: "mfa_misconfigured" });
      return authFailure("MFA_MISCONFIGURED");
    }

    if (!twoFactorCode) {
      logLoginDebug({ email, userId: user.id, stepFailed: "authenticator_mfa_required" });
      return authFailure("MFA_REQUIRED", { method: "authenticator" });
    }

    if (
      !(await verifyAuthenticatorCode(
        {
          id: user.id,
          authenticatorSecretEncrypted: user.authenticatorSecretEncrypted
        },
        twoFactorCode
      ))
    ) {
      logLoginDebug({ email, userId: user.id, stepFailed: "invalid_authenticator_mfa_code" });
      return authFailure("INVALID_MFA_CODE");
    }
  }

  logger.info("auth.login.verified", { email, userId: user.id });
  return authResult({
    ok: true,
    loginToken: await createSessionLoginToken(user.id)
  });
}

export async function POST(request: Request) {
  try {
    return await handleLogin(request);
  } catch (error) {
    logger.error("auth.login_api.failed", {
      error: error instanceof Error ? error.message : "Unknown login error"
    });
    return apiError("LOGIN_FAILED", 500);
  }
}
