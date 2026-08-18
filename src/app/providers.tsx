"use client";

import { PortalProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { ProfileProvider } from "@/lib/profile";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGate } from "@/components/AuthGate";
import { NavProgressProvider } from "@/components/RouteProgress";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <PortalProvider>
            <NavProgressProvider>
              <AuthGate>{children}</AuthGate>
            </NavProgressProvider>
          </PortalProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
