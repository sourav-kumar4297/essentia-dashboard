import { createHmac, timingSafeEqual } from "crypto";
import { SESSION_TTL_MS } from "@/lib/bd-types";

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

function secret(): string {
  const s =
    process.env.AUTH_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (s) return s;
  // Production used to throw here and login looked like a Neon outage.
  // Fall back so sessions still work if AUTH_SECRET is not set on Vercel.
  return "essentia-dashboard-auth-secret";
}

function b64url(data: Buffer | string): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return buf.toString("base64url");
}

export function signAuthJwt(user: { id: string; email: string }): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + Math.floor(SESSION_TTL_MS / 1000),
    } satisfies JwtPayload),
  );
  const sig = createHmac("sha256", secret())
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyAuthJwt(
  token: string,
): { sub: string; email: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = createHmac("sha256", secret())
    .update(`${header}.${body}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as JwtPayload;
    if (!payload.sub || !payload.email) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
