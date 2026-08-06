"use client";

import { PortalProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { ProfileProvider } from "@/lib/profile";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/AuthGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <PortalProvider>
            <AuthGate>{children}</AuthGate>
          </PortalProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
