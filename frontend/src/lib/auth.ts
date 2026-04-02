import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "user" | "admin";
    };
  }
}

declare module "next-auth" {
  interface JWT {
    accessToken?: string;
    role?: "user" | "admin";
  }
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "admin@insightx.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

const isDev = process.env.NODE_ENV === "development" || !process.env.AZURE_AD_CLIENT_ID;

// Build providers list
const providers: Provider[] = [];

// Dev credentials provider - allows local sign-in without Azure AD
if (isDev) {
  providers.push(
    Credentials({
      id: "credentials",
      name: "Dev Login",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@insightx.com" },
        name: { label: "Name", type: "text", placeholder: "John Doe" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string) ?? "user@insightx.com";
        const name = (credentials?.name as string) ?? "Dev User";
        return {
          id: email,
          email,
          name,
          image: null,
        };
      },
    })
  );
}

// Azure AD provider - for production
if (process.env.AZURE_AD_CLIENT_ID) {
  // Dynamic import to avoid errors when env vars missing
  const MicrosoftEntraID = require("next-auth/providers/microsoft-entra-id").default;
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token ?? "dev-token";
        const email = (user?.email ?? token.email ?? "").toLowerCase();
        token.role = ADMIN_EMAILS.includes(email) ? "admin" : "user";
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "user" | "admin") ?? "user";
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/login")) {
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (pathname.startsWith("/admin")) {
        return auth?.user?.role === "admin";
      }

      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
});
