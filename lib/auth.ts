import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  startEmailTwoFactorChallenge,
  verifyAuthenticatorCode,
  verifyEmailTwoFactorCode
} from "@/lib/two-factor";
import { loginSchema } from "@/lib/validation";

const useSecureCookies =
  process.env.NODE_ENV === "production" && process.env.NEXTAUTH_URL?.startsWith("https://");

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60
  },
  pages: {
    signIn: "/login"
  },
  useSecureCookies,
  cookies: useSecureCookies
    ? {
        sessionToken: {
          name: "__Secure-next-auth.session-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true
          }
        },
        callbackUrl: {
          name: "__Secure-next-auth.callback-url",
          options: {
            sameSite: "lax",
            path: "/",
            secure: true
          }
        },
        csrfToken: {
          name: "__Host-next-auth.csrf-token",
          options: {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: true
          }
        }
      }
    : undefined,
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "Verification code", type: "text" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
          twoFactorCode: credentials?.twoFactorCode
        });

        if (!parsed.success) {
          logger.warn("auth.login.validation_failed");
          return null;
        }

        const { email, password, twoFactorCode } = parsed.data;
        const rateLimit = checkRateLimit(`login:${email}`, {
          limit: 8,
          windowMs: 15 * 60 * 1000
        });
        if (!rateLimit.allowed) {
          logger.warn("auth.login.rate_limited", { email });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          logger.warn("auth.login.unknown_user", { email });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          logger.warn("auth.login.invalid_password", { email, userId: user.id });
          return null;
        }

        if (!user.emailVerifiedAt) {
          logger.warn("auth.login.email_unverified", { email, userId: user.id });
          throw new Error("EMAIL_VERIFICATION_REQUIRED");
        }

        if (user.twoFactorMethod === "email") {
          if (!twoFactorCode) {
            await startEmailTwoFactorChallenge(user);
            throw new Error("EMAIL_OTP_REQUIRED");
          }

          if (!(await verifyEmailTwoFactorCode(user.id, twoFactorCode))) {
            return null;
          }
        }

        if (user.twoFactorMethod === "authenticator") {
          if (!twoFactorCode) {
            throw new Error("AUTHENTICATOR_OTP_REQUIRED");
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
            return null;
          }
        }

        logger.info("auth.login.success", { email, userId: user.id });
        return {
          id: user.id,
          name: user.username,
          email: user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  events: {
    async signOut({ token }) {
      logger.info("auth.logout", { userId: token?.id as string | undefined });
    }
  }
};
