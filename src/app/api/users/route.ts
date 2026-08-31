import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canAssignLeads, canManageUsers } from "@/lib/rbac";

/** List members/admins for assignment dropdown */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAssignLeads(user.role) && !canManageUsers(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, blocked: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ users });
}
