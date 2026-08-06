"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandLoader } from "@/components/BrandLoader";
import { useAuth } from "@/lib/auth-context";

const SPLASH_MS = 1600;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (user && pathname === "/login") {
      router.replace("/pipeline");
    }
  }, [user, loading, pathname, router]);

  if (!splashDone || loading) {
    return <BrandLoader />;
  }

  if (!user && pathname !== "/login") {
    return <BrandLoader />;
  }

  return <>{children}</>;
}
