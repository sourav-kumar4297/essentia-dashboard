import {
  isPresetAllowedEmail,
  normalizeEmail,
} from "@/lib/allowed-users";

export { normalizeEmail };

function isSuperAdminEmail(email: string): boolean {
  const e = normalizeEmail(email);
  const fromEnv = (process.env.SUPERADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  const defaults = ["souravkumar4297@gmail.com"];
  return new Set([...defaults, ...fromEnv]).has(e);
}

/** Only Super Admin + pre-approved emails (and test accounts when enabled). */
export function isAllowedLoginEmail(email: string): boolean {
  const e = normalizeEmail(email);
  if (!e.includes("@")) return false;
  if (isSuperAdminEmail(e)) return true;
  return isPresetAllowedEmail(e);
}

export const LOGIN_EMAIL_HINT =
  "This email is not authorised. Contact a Super Admin.";
