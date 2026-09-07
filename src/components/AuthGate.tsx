"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { useAuth } from "@/lib/auth-context";
import { needsProfileSetup } from "@/lib/session-client";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLogin = pathname === "/login";
  const isOnboarding = pathname === "/onboarding";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLogin) {
      router.replace("/login");
      return;
    }
    if (!user) return;

    const needsSetup = needsProfileSetup(user);

    if (needsSetup && !isOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (!needsSetup && (isLogin || isOnboarding)) {
      router.replace("/pipeline");
      return;
    }
    if (user && isLogin && !needsSetup) {
      router.replace("/pipeline");
    }
  }, [user, loading, isLogin, isOnboarding, router]);

  if (isLogin) {
    if (user) {
      return (
        <BrandLoader
          status={
            needsProfileSetup(user)
              ? "Opening profile setup…"
              : "Opening dashboard…"
          }
        />
      );
    }
    return <>{children}</>;
  }

  if (isOnboarding) {
    if (loading) {
      return <BrandLoader status="Checking your session…" />;
    }
    if (!user) {
      return <BrandLoader status="Redirecting to sign in…" />;
    }
    if (!needsProfileSetup(user)) {
      return <BrandLoader status="Opening dashboard…" />;
    }
    return <>{children}</>;
  }

  if (loading) {
    return <BrandLoader status="Checking your session…" />;
  }

  if (!user) {
    return <BrandLoader status="Redirecting to sign in…" />;
  }

  if (needsProfileSetup(user)) {
    return <BrandLoader status="Opening profile setup…" />;
  }

  return <>{children}</>;
}
