import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import PostgresAdapter from "@auth/pg-adapter";
import { Pool } from "pg";
import { neon } from "@neondatabase/serverless";
import { compare } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT id, name, email, image, password_hash
          FROM users WHERE email = ${String(credentials.email).toLowerCase()}
        ` as { id: string; name: string | null; email: string; image: string | null; password_hash: string | null }[];
        const user = rows[0];
        if (!user?.password_hash) return null;
        const valid = await compare(String(credentials.password), user.password_hash);
        if (!valid) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    // ── Admin impersonation — one-time token, 5-min TTL ──────────────────────
    Credentials({
      id: "impersonate",
      name: "impersonate",
      credentials: { token: { type: "text" } },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`
          SELECT it.user_id, u.name, u.email, u.image
          FROM impersonation_tokens it
          JOIN users u ON u.id = it.user_id
          WHERE it.token = ${String(credentials.token)}
            AND it.expires_at > NOW()
            AND it.used = false
          LIMIT 1
        ` as { user_id: number; name: string | null; email: string; image: string | null }[];
        if (!rows[0]) return null;
        await sql`UPDATE impersonation_tokens SET used = true WHERE token = ${String(credentials.token)}`;
        return { id: String(rows[0].user_id), name: rows[0].name, email: rows[0].email, image: rows[0].image };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id;
        try {
          const sql = neon(process.env.DATABASE_URL!);
          const rows = await sql`SELECT plan, created_at FROM users WHERE id = ${user.id}`;
          token.plan = (rows[0]?.plan as string) ?? "starter";

          // Phase 3 Sprint 4: last_login_at für Admin-Übersicht. Schreibt
          // bei jedem JWT-Issue (=Login). Silently failt wenn die Spalte
          // fehlt — Migration noch nicht durch ist kein Login-Blocker.
          await sql`UPDATE users SET last_login_at = NOW() WHERE id = ${user.id}`.catch(() => {});

          // Welcome-Mail nur beim ersten Login (Account gerade erstellt)
          const createdAt = rows[0]?.created_at as string | undefined;
          const isNew = createdAt && (Date.now() - new Date(createdAt).getTime()) < 60_000;
          if (isNew && user.email && process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "WebsiteFix <support@website-fix.com>",
              to: user.email,
              subject: "Willkommen bei WebsiteFix 👋",
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;color:#111">
                  <h1 style="font-size:24px;margin-bottom:8px">Willkommen, ${user.name?.split(" ")[0] ?? ""}!</h1>
                  <p style="color:#555;line-height:1.6">Dein WebsiteFix-Account ist bereit. Du kannst jetzt Websites scannen — kostenlos, ohne Plugin, ohne Entwickler.</p>
                  <a href="${process.env.NEXTAUTH_URL}/fuer-agenturen#pricing" style="display:inline-block;margin:24px 0;padding:14px 28px;background:linear-gradient(90deg,#8df3d3,#7aa6ff);color:#0b0c10;text-decoration:none;border-radius:10px;font-weight:700">
                    Plan auswählen →
                  </a>
                  <p style="color:#999;font-size:13px">Bei Fragen: support@website-fix.com</p>
                </div>
              `,
            }).catch(() => {/* E-Mail-Fehler nicht blockieren */});
          }
        } catch {
          token.plan = "starter";
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        (session.user as { plan?: string }).plan = (token.plan as string) ?? "starter";
      }
      return session;
    },
  },
});
