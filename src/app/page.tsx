"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BrandLoader } from "@/components/BrandLoader";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/pipeline" : "/login");
  }, [user, loading, router]);

  return <BrandLoader />;
}
