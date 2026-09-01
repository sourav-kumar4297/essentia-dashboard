import { NextResponse } from "next/server";
import { signInTestAccount } from "@/lib/test-login";
import { SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/bd-types";

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

    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = body.email?.trim() ?? "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 },
      );
    }

    const signedIn = await withDbRetry(() => signInTestAccount(email));
    if (!signedIn) {
      return NextResponse.json({ error: "Not a test account." }, { status: 401 });
    }

    const res = NextResponse.json({
      ok: true,
      user: signedIn.user,
    });

    res.cookies.set(SESSION_COOKIE, signedIn.token, {
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
    if (message === "ACCOUNT_BLOCKED") {
      return NextResponse.json(
        { error: "This account is blocked. Contact a Super Admin." },
        { status: 403 },
      );
    }
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
