import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser, needsProfileSetup } from "@/lib/session";
import { isValidPhone, PHONE_FORMAT_HINT } from "@/lib/phone";
import type { Role } from "@/lib/bd-types";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (!needsProfileSetup(session)) {
      return NextResponse.json(
        { error: "Profile is already set up." },
        { status: 400 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      phone?: string;
    };

    const name = (body.name ?? "").trim();
    const phone = (body.phone ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Enter your name." },
        { status: 400 },
      );
    }
    if (!phone) {
      return NextResponse.json(
        { error: "Enter your phone number." },
        { status: 400 },
      );
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: PHONE_FORMAT_HINT }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        name,
        phone,
        profileSetupComplete: true,
        team: session.team || "business-development",
      },
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
      },
    });
  } catch (err) {
    console.error("[auth/setup-profile]", err);
    return NextResponse.json(
      { error: "Could not save profile." },
      { status: 500 },
    );
  }
}
