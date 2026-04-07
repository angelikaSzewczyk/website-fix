import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import { neon } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Bei erstem Login: Plan aus DB laden und in JWT speichern
      if (user?.id) {
        token.userId = user.id;
        try {
          const sql = neon(process.env.DATABASE_URL!);
          const rows = await sql`SELECT plan FROM users WHERE id = ${user.id}`;
          token.plan = (rows[0]?.plan as string) ?? "free";
        } catch {
          token.plan = "free";
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        (session.user as { plan?: string }).plan = (token.plan as string) ?? "free";
      }
      return session;
    },
  },
});
