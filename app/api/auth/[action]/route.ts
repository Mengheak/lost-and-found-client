import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/lib/auth";
import { validPassword } from "@/lib/auth";

const ACCESS = "lf_access";
const REFRESH = "lf_refresh";
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/api/auth" };
type Tokens = { accessToken: string; refreshToken: string; expiresInSeconds: number; user: AuthUser };
function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
function clearSession(result: NextResponse) {
  for (const name of [ACCESS, REFRESH]) result.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  return result;
}
function setSession(result: NextResponse, tokens: Tokens) {
  result.cookies.set(ACCESS, tokens.accessToken, { ...cookieOptions, maxAge: tokens.expiresInSeconds });
  // Backend validates the actual expiry; the browser never decides token validity.
  result.cookies.set(REFRESH, tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 86400 });
  return result;
}
function publicUser(user: AuthUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt };
}
async function backend(path: string, body?: object, token?: string) {
  return fetch(new URL(`/api/${path}`, process.env.API_BASE_URL || "http://localhost:8080"), {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store", signal: AbortSignal.timeout(10000),
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  // Same-origin JSON POSTs protect cookie-authenticated requests from CSRF.
  if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) {
    return response({ message: "Request not permitted" }, 403);
  }
  const { action } = await context.params;
  if (!["login", "register", "session", "logout"].includes(action)) return response({ message: "Not found" }, 404);
  try {
    if (action === "login" || action === "register") {
      let body;
      try { body = await request.json(); } catch { return response({ message: "Invalid request" }, 400); }
      if (!body || typeof body.email !== "string" || typeof body.password !== "string" || !body.email.trim() || !body.password) return response({ message: "Invalid credentials" }, 400);
      const payload: Record<string, string> = { email: body.email.trim(), password: body.password };
      if (action === "register") {
        if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 255 || body.email.length > 255 || !validPassword(body.password) || (body.phone != null && (typeof body.phone !== "string" || body.phone.length > 50))) return response({ message: "Invalid registration details" }, 400);
        payload.name = body.name.trim();
        if (body.phone?.trim()) payload.phone = body.phone.trim();
      }
      const upstream = await backend(`auth/${action}`, payload);
      if (!upstream.ok) return response({ message: "Authentication failed" }, upstream.status);
      const { data } = await upstream.json() as { data: Tokens };
      return setSession(response({ user: publicUser(data.user) }, action === "register" ? 201 : 200), data);
    }

    let access = request.cookies.get(ACCESS)?.value;
    const refresh = request.cookies.get(REFRESH)?.value;
    let tokens: Tokens | undefined;
    const profile = access ? await backend("users/me", undefined, access) : undefined;
    if ((!profile || profile.status === 401) && refresh) {
      const renewed = await backend("auth/refresh", { refreshToken: refresh });
      if (!renewed.ok) {
        if ([401, 403].includes(renewed.status)) return clearSession(response({ user: null }, 401));
        return response({ message: "Session service unavailable" }, 503);
      }
      tokens = (await renewed.json()).data as Tokens;
      access = tokens.accessToken;
    }
    if (!tokens && (!profile || [401, 403].includes(profile.status))) return clearSession(response({ user: null }, 401));
    if (!tokens && !profile?.ok) return response({ message: "Session service unavailable" }, 503);
    if (action === "logout") {
      const loggedOut = await backend("auth/logout", {}, access).catch(() => null);
      if (!loggedOut || (!loggedOut.ok && loggedOut.status !== 401)) {
        const result = response({ message: "Could not sign out. Please retry." }, 503);
        return tokens ? setSession(result, tokens) : result;
      }
      return clearSession(response({ user: null }));
    }
    const user = tokens?.user ?? (await profile!.json()).data;
    const result = response({ user: publicUser(user) });
    return tokens ? setSession(result, tokens) : result;
  } catch {
    return response({ message: "Account service unavailable" }, 503);
  }
}
