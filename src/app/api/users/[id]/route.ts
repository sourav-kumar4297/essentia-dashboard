import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canManageUsers } from "@/lib/rbac";
import type { Role } from "@/lib/bd-types";

const ASSIGNABLE: Role[] = ["ADMIN", "MEMBER"];

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json(
      { error: "You cannot change your own account this way." },
      { status: 400 },
    );
  }

  const body = (await req.json()) as { role?: string; blocked?: boolean };
  const data: { role?: Role; blocked?: boolean } = {};

  if ("role" in body && body.role != null) {
    const role = body.role as Role;
    if (!ASSIGNABLE.includes(role)) {
      return NextResponse.json(
        { error: "Role must be ADMIN or MEMBER." },
        { status: 400 },
      );
    }
    data.role = role;
  }

  if ("blocked" in body) {
    data.blocked = Boolean(body.blocked);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (target.role === "SUPERADMIN") {
    return NextResponse.json(
      { error: "Cannot change a Super Admin." },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, blocked: true },
  });
  return NextResponse.json({ user: updated });
}
