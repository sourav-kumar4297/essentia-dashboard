import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, ensureUser } from "@/lib/session";
import { SESSION_COOKIE, SESSION_TTL_MS, type Role } from "@/lib/bd-types";

/** Production + local test accounts — no OTP. */
const ACCOUNTS: Record<
  string,
  { email: string; name: string; role: Role; aliases: string[] }
> = {
  admin: {
    email: "admin@essentia.com",
    name: "BD Admin",
    role: "ADMIN",
    aliases: [
      "admin",
      "admin@essentia.com",
      "admin@essentia.local",
    ],
  },
  member: {
    email: "member@essentia.com",
    name: "BD Member",
    role: "MEMBER",
    aliases: [
      "member",
      "member@essentia.com",
      "member@essentia",
      "member@essentia.local",
    ],
  },
};

const DEMO_PASSWORD = "password123";

function resolveAccount(body: {
  account?: string;
  username?: string;
  password?: string;
  demo?: boolean;
}) {
  if (body.account && ACCOUNTS[body.account]) return ACCOUNTS[body.account];
  if (body.demo === true) return ACCOUNTS.admin;

  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (password && password !== DEMO_PASSWORD) return null;

  for (const acc of Object.values(ACCOUNTS)) {
    if (acc.aliases.includes(username)) return acc;
  }
  return null;
}

function isDbUnreachable(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return /DATABASE_URL|Can't reach|ECONNREFUSED|ETIMEDOUT|P1001|P1017|P1000|Environment variable not found/i.test(
    message,
  );
}

async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isDbUnreachable(err)) throw err;
    await new Promise((r) => setTimeout(r, 600));
    return fn();
  }
}

export async function POST(req: Request) {
  try {
    if (process.env.ALLOW_TEST_LOGIN === "false") {
      return NextResponse.json(
        { error: "Test login is disabled." },
        { status: 403 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      account?: string;
      username?: string;
      password?: string;
      demo?: boolean;
    };

    const account = resolveAccount(body);
    if (!account) {
      return NextResponse.json(
        { error: "Use a test account on this screen to sign in." },
        { status: 401 },
      );
    }

    const user = await withDbRetry(async () => {
      const base = await ensureUser(account.email, account.name);
      return prisma.user.update({
        where: { id: base.id },
        data: { name: account.name, role: account.role },
      });
    });

    if (user.blocked) {
      return NextResponse.json(
        { error: "This account is blocked. Contact a Super Admin." },
        { status: 403 },
      );
    }

    const token = await createSession({
      id: user.id,
      email: user.email,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
      },
    });

    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
    return res;
  } catch (err) {
    console.error("[auth/login]", err);
    const message = err instanceof Error ? err.message : "";
    if (isDbUnreachable(err)) {
      return NextResponse.json(
        {
          error:
            "Database is not reachable. Confirm DATABASE_URL (Neon) in Vercel env, then retry.",
        },
        { status: 500 },
      );
    }
    if (/AUTH_SECRET/i.test(message)) {
      return NextResponse.json(
        { error: "Auth is not configured. Set AUTH_SECRET in Vercel env." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Could not sign in. Please try again." },
      { status: 500 },
    );
  }
}
