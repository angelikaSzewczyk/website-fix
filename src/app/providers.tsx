"use client";

/**
 * Providers — Client-Component-Wrapper für globale Context-Provider.
 *
 * Aktuell:
 *   - SessionProvider (next-auth) — wird von useSession() in Client-Components
 *     wie /register/page.tsx und LoginClient gebraucht. Ohne Provider werfen
 *     diese Hooks 'Cannot destructure property "status" of undefined'-Crashes
 *     beim Rendern.
 *
 * Wird als Wrapper um {children} im RootLayout (app/layout.tsx) eingesetzt.
 */

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
