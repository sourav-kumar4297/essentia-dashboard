"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { BrandLoader } from "@/components/BrandLoader";

/** Minimum time the brand intro stays on screen (ms) so it never flashes. */
const SPLASH_MS = 1600;

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const ok = isAuthenticated();
    if (!ok && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (ok && pathname === "/login") {
      router.replace("/pipeline");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!splashDone || (!ready && pathname !== "/login")) {
    return <BrandLoader />;
  }

  return <>{children}</>;
}
