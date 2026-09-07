import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isValidPhone, PHONE_FORMAT_HINT } from "@/lib/phone";
import type { Role } from "@/lib/bd-types";

/** Update own display name / phone. */
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      phone?: string;
    };
    const data: { name?: string; phone?: string } = {};
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }
    if (typeof body.phone === "string") {
      const phone = body.phone.trim();
      if (phone && !isValidPhone(phone)) {
        return NextResponse.json({ error: PHONE_FORMAT_HINT }, { status: 400 });
      }
      data.phone = phone;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role as Role,
        team: updated.team,
        phone: updated.phone,
        profileSetupComplete: updated.profileSetupComplete,
        ...(session.impersonator
          ? { impersonator: session.impersonator }
          : {}),
      },
    });
  } catch (err) {
    console.error("[auth/profile]", err);
    return NextResponse.json(
      { error: "Could not update profile." },
      { status: 500 },
    );
  }
}
