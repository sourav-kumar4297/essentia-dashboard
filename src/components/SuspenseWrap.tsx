"use client";

import { Suspense } from "react";
import { ContentSkeleton } from "@/components/PortalSkeleton";

export function SuspenseWrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<ContentSkeleton />}>{children}</Suspense>;
}
