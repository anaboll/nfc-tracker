import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface User {
    mustChangePass?: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      mustChangePass?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    mustChangePass?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Login", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          mustChangePass: user.mustChangePass,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mustChangePass = user.mustChangePass;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.mustChangePass = token.mustChangePass;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
} as NextAuthOptions;

// Trust host for Cloudflare proxy - set via NEXTAUTH_URL env var
