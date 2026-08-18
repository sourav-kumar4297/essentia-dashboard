"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLogin) {
      router.replace("/login");
      return;
    }
    if (user && isLogin) {
      router.replace("/pipeline");
    }
  }, [user, loading, isLogin, router]);

  // Login form should paint immediately — never trap people on a black splash
  // while the session check is in flight.
  if (isLogin) {
    if (user) {
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

  return <>{children}</>;
}
