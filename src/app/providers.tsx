"use client";

import { PortalProvider } from "@/lib/store";
import { ThemeProvider } from "@/lib/theme";
import { ProfileProvider } from "@/lib/profile";
import { AuthGate } from "@/components/AuthGate";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <PortalProvider>
          <AuthGate>{children}</AuthGate>
        </PortalProvider>
      </ProfileProvider>
    </ThemeProvider>
  );
}
