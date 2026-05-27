import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

const useSecureCookies =
  process.env.NODE_ENV === "production" &&
  process.env.NEXTAUTH_URL?.startsWith("https://");

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
  cookies:
    useSecureCookies
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
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password
        });

        if (!parsed.success) {
          logger.warn("auth.login.validation_failed");
          return null;
        }

        const { email, password } = parsed.data;
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
