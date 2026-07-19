const AUTH_KEY = "essentia_portal_auth";

export const DEMO_CREDENTIALS = {
  username: "admin",
  password: "password123",
} as const;

export function login(username: string, password: string): boolean {
  if (
    username.trim() === DEMO_CREDENTIALS.username &&
    password === DEMO_CREDENTIALS.password
  ) {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ user: username, at: Date.now() }),
      );
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return Boolean(raw && JSON.parse(raw)?.user);
  } catch {
    return false;
  }
}
