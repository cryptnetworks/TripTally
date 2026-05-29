import * as bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";
import { POST as loginPost } from "@/app/api/auth/login/route";
import { authOptions } from "@/lib/auth";
import { consumeOAuthLoginToken, createOAuthLoginToken } from "@/lib/oauth-login";
import { encryptSecret } from "@/lib/secret-encryption";
import { generateTotpCode } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

const testRun = Date.now();
const createdUserIds: string[] = [];

const credentialsProvider = authOptions.providers[0] as {
  options: {
    authorize: (credentials: Record<string, unknown>, request: unknown) => Promise<unknown>;
  };
};

async function authorize(credentials: Record<string, unknown>) {
  return credentialsProvider.options.authorize(credentials, {});
}

async function expectAuthorizeError(credentials: Record<string, unknown>, message: string) {
  await expect(authorize(credentials)).rejects.toThrow(message);
}

async function postLogin(body: Record<string, unknown>) {
  const response = await loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
  );
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>
  };
}

async function postCrossOriginLogin(body: Record<string, unknown>) {
  const response = await loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
        Host: "localhost"
      },
      body: JSON.stringify(body)
    })
  );
  return {
    status: response.status,
    body: (await response.json()) as Record<string, unknown>
  };
}

async function createLoginUser(label: string, data: Partial<User> = {}) {
  const user = await prisma.user.create({
    data: {
      username: `auth-${label}-${testRun}`,
      email: `auth-${label}-${testRun}@triptally.test`,
      passwordHash: await bcrypt.hash("TestPass123", 12),
      emailVerifiedAt: new Date(),
      twoFactorMethod: "none",
      ...data
    }
  });
  createdUserIds.push(user.id);
  return user;
}

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.twoFactorChallenge.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
  await prisma.$disconnect();
});

describe("credentials login with MFA", () => {
  it("logs in an existing non-MFA user with the stored password hash", async () => {
    const user = await createLoginUser("no-mfa");

    const result = await authorize({
      email: user.email,
      password: "TestPass123"
    });

    expect(result).toMatchObject({
      id: user.id,
      email: user.email
    });
  });

  it("prompts an MFA-enabled email-code user after a correct password", async () => {
    const user = await createLoginUser("email-mfa-prompt", { twoFactorMethod: "email" });

    await expectAuthorizeError(
      {
        email: user.email,
        password: "TestPass123"
      },
      "EMAIL_OTP_REQUIRED"
    );
  });

  it("logs in an MFA-enabled email-code user with a valid code", async () => {
    const code = "123456";
    const user = await createLoginUser("email-mfa-valid", { twoFactorMethod: "email" });
    await prisma.twoFactorChallenge.create({
      data: {
        userId: user.id,
        method: "email",
        codeHash: await bcrypt.hash(code, 12),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    const result = await authorize({
      email: user.email,
      password: "TestPass123",
      twoFactorCode: code
    });

    expect(result).toMatchObject({
      id: user.id,
      email: user.email
    });
  });

  it("rejects an MFA-enabled user with an invalid code without claiming the password failed", async () => {
    const user = await createLoginUser("email-mfa-invalid", { twoFactorMethod: "email" });
    await prisma.twoFactorChallenge.create({
      data: {
        userId: user.id,
        method: "email",
        codeHash: await bcrypt.hash("123456", 12),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    await expectAuthorizeError(
      {
        email: user.email,
        password: "TestPass123",
        twoFactorCode: "654321"
      },
      "INVALID_MFA_CODE"
    );
  });

  it("still fails an incorrect password", async () => {
    const user = await createLoginUser("wrong-password");

    const result = await authorize({
      email: user.email,
      password: "WrongPass123"
    });

    expect(result).toBeNull();
  });

  it("does not force MFA when optional MFA fields are null", async () => {
    const user = await createLoginUser("null-mfa-fields", {
      twoFactorMethod: "none",
      authenticatorEnabled: false,
      authenticatorSecretEncrypted: null
    });

    const result = await authorize({
      email: user.email,
      password: "TestPass123"
    });

    expect(result).toMatchObject({
      id: user.id,
      email: user.email
    });
  });

  it("logs in an authenticator MFA user with a valid code", async () => {
    const secret = "JBSWY3DPEHPK3PXP";
    const user = await createLoginUser("authenticator-valid", {
      twoFactorMethod: "authenticator",
      authenticatorEnabled: true,
      authenticatorSecretEncrypted: encryptSecret(secret)
    });

    const result = await authorize({
      email: user.email,
      password: "TestPass123",
      twoFactorCode: generateTotpCode(secret)
    });

    expect(result).toMatchObject({
      id: user.id,
      email: user.email
    });
  });

  it("fails safely when authenticator MFA is enabled without a secret", async () => {
    const user = await createLoginUser("authenticator-misconfigured", {
      twoFactorMethod: "authenticator",
      authenticatorEnabled: true,
      authenticatorSecretEncrypted: null
    });

    await expectAuthorizeError(
      {
        email: user.email,
        password: "TestPass123",
        twoFactorCode: "123456"
      },
      "MFA_MISCONFIGURED"
    );
  });
});

describe("login API", () => {
  it("returns an MFA challenge as JSON without a 401 response", async () => {
    const user = await createLoginUser("api-email-mfa-prompt", { twoFactorMethod: "email" });

    const result = await postLogin({
      email: user.email,
      password: "TestPass123"
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      ok: false,
      error: "MFA_REQUIRED",
      method: "email"
    });
  });

  it("returns invalid MFA code as JSON without a 401 response", async () => {
    const user = await createLoginUser("api-email-mfa-invalid", { twoFactorMethod: "email" });
    await prisma.twoFactorChallenge.create({
      data: {
        userId: user.id,
        method: "email",
        codeHash: await bcrypt.hash("123456", 12),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });

    const result = await postLogin({
      email: user.email,
      password: "TestPass123",
      twoFactorCode: "654321"
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      ok: false,
      error: "INVALID_MFA_CODE"
    });
  });

  it("returns a one-time login token after password-only auth completes", async () => {
    const user = await createLoginUser("api-no-mfa");

    const result = await postLogin({
      email: user.email,
      password: "TestPass123"
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(result.body.loginToken).toEqual(expect.any(String));
  });

  it("creates a NextAuth user from the one-time login token", async () => {
    const user = await createLoginUser("api-login-token");
    const result = await postLogin({
      email: user.email,
      password: "TestPass123"
    });

    const sessionUser = await authorize({
      email: "verified-login@example.com",
      loginToken: result.body.loginToken
    });

    expect(sessionUser).toMatchObject({
      id: user.id,
      email: user.email
    });
  });

  it("rejects cross-origin login API posts", async () => {
    const result = await postCrossOriginLogin({
      email: "user@example.com",
      password: "TestPass123"
    });

    expect(result.status).toBe(403);
    expect(result.body).toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to do that."
      }
    });
  });

  it("creates a NextAuth user from an HTTP-only OAuth login cookie token", async () => {
    const user = await createLoginUser("oauth-cookie-token");
    const token = await createOAuthLoginToken(user.id);

    const sessionUser = await credentialsProvider.options.authorize(
      {
        email: "oauth@example.com",
        oauthLoginToken: "cookie"
      },
      {
        headers: {
          cookie: `__Host-triptally.oauth-login-token=${token}`
        }
      }
    );

    expect(sessionUser).toMatchObject({
      id: user.id,
      email: user.email
    });
  });

  it("rejects an invalid OAuth login token", async () => {
    await expect(
      authorize({
        email: "oauth@example.com",
        oauthLoginToken: "invalid-token"
      })
    ).resolves.toBeNull();
  });

  it("rejects an invalid OAuth login cookie token", async () => {
    await expect(
      credentialsProvider.options.authorize(
        {
          email: "oauth@example.com",
          oauthLoginToken: "cookie"
        },
        {
          headers: {
            cookie: "__Host-triptally.oauth-login-token=invalid-token"
          }
        }
      )
    ).resolves.toBeNull();
  });

  it("rejects an expired OAuth login token", async () => {
    const user = await createLoginUser("oauth-expired-token");
    const token = await createOAuthLoginToken(user.id);

    await prisma.oAuthLoginToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 60_000) }
    });

    await expect(consumeOAuthLoginToken(token)).resolves.toBeNull();
    await expect(
      authorize({
        email: "oauth@example.com",
        oauthLoginToken: token
      })
    ).resolves.toBeNull();
  });

  it("rejects an expired OAuth login cookie token", async () => {
    const user = await createLoginUser("oauth-expired-cookie-token");
    const token = await createOAuthLoginToken(user.id);

    await prisma.oAuthLoginToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 60_000) }
    });

    await expect(
      credentialsProvider.options.authorize(
        {
          email: "oauth@example.com",
          oauthLoginToken: "cookie"
        },
        {
          headers: {
            cookie: `__Host-triptally.oauth-login-token=${token}`
          }
        }
      )
    ).resolves.toBeNull();
  });
});
