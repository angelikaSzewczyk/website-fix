import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Edge-kompatible Auth-Config ohne pg-Adapter — nur für Middleware
export const { auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
});
