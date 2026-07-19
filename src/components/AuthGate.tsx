"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { PortalSkeleton } from "@/components/PortalSkeleton";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

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

  if (!ready && pathname !== "/login") {
    return <PortalSkeleton />;
  }

  return <>{children}</>;
}
