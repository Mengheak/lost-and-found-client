import { NextRequest, NextResponse } from "next/server";
import type { AuthUser } from "@/lib/auth";
import { validateReport, validatePhotos } from "@/lib/report-item";
import { validateProfile } from "@/lib/profile";
import { validPassword } from "@/lib/auth";

const ACCESS = "lf_access";
const REFRESH = "lf_refresh";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
};
type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: AuthUser;
};
function response(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
function clearSession(result: NextResponse) {
  for (const name of [ACCESS, REFRESH])
    result.cookies.set(name, "", { ...cookieOptions, maxAge: 0 });
  return result;
}
function setSession(result: NextResponse, tokens: Tokens) {
  result.cookies.set(ACCESS, tokens.accessToken, {
    ...cookieOptions,
    maxAge: tokens.expiresInSeconds,
  });
  // Backend validates the actual expiry; the browser never decides token validity.
  result.cookies.set(REFRESH, tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 86400 });
  return result;
}
function publicUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePhotoUrl: user.profilePhotoUrl ?? null,
    role: user.role,
    createdAt: user.createdAt,
  };
}
async function backend(path: string, body?: object, token?: string) {
  return fetch(new URL(`/api/${path}`, process.env.API_BASE_URL || "http://localhost:8080"), {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  const reporting = action === "report-item" || action === "edit-item";
  // Same-origin POSTs protect cookie-authenticated requests from CSRF.
  if (
    request.headers.get("origin") !== request.nextUrl.origin ||
    !request.headers
      .get("content-type")
      ?.startsWith(
        reporting || action === "update-profile" ? "multipart/form-data;" : "application/json",
      )
  ) {
    return response({ message: "Request not permitted" }, 403);
  }
  if (
    ![
      "update-profile",
      "login",
      "register",
      "session",
      "logout",
      "google-start",
      "google-complete",
      "report-item",
      "edit-item",
      "my-items",
      "item-status",
    ].includes(action)
  )
    return response({ message: "Not found" }, 404);
  try {
    if (action === "google-start" || action === "google-complete") {
      // Spring's browser handshake cookie must reach both the backend callback
      // and this BFF. Use the same public hostname (different localhost ports work).
      const apiOrigin = new URL(
        process.env.GOOGLE_API_PUBLIC_URL || process.env.API_BASE_URL || "http://localhost:8080",
      );
      if (
        apiOrigin.hostname !== request.nextUrl.hostname ||
        apiOrigin.protocol !== request.nextUrl.protocol
      ) {
        return response(
          {
            message: "Google sign-in requires a shared public hostname.",
            code: "GOOGLE_CONFIGURATION",
          },
          503,
        );
      }
      const completing = action === "google-complete";
      const sessionId = request.cookies.get("JSESSIONID")?.value;
      if (completing && (!sessionId || !request.cookies.get("lf_google_pending"))) {
        return response({ message: "Google sign-in has expired. Please start again." }, 401);
      }
      const upstream = await fetch(
        new URL(
          `/api/auth/google/${completing ? "complete" : "start"}`,
          process.env.API_BASE_URL || "http://localhost:8080",
        ),
        {
          method: "POST",
          headers: {
            Origin: request.nextUrl.origin,
            "Content-Type": "application/json",
            ...(sessionId ? { Cookie: `JSESSIONID=${encodeURIComponent(sessionId)}` } : {}),
          },
          body: "{}",
          cache: "no-store",
          redirect: "manual",
          signal: AbortSignal.timeout(10000),
        },
      );
      const clearHandshake = (result: NextResponse) => {
        result.cookies.set("lf_google_pending", "", { ...cookieOptions, maxAge: 0 });
        result.cookies.set("JSESSIONID", "", { ...cookieOptions, path: "/", maxAge: 0 });
        return result;
      };
      if (!upstream.ok) {
        const result = response(
          {
            message: "Google sign-in could not be completed.",
            code:
              upstream.status === 404
                ? "GOOGLE_DISABLED"
                : upstream.status === 403 && !completing
                  ? "GOOGLE_CONFIGURATION"
                  : "GOOGLE_FAILED",
          },
          upstream.status,
        );
        return completing ? clearHandshake(result) : result;
      }
      const { data } = await upstream.json();
      if (completing) {
        if (!data?.accessToken || !data?.refreshToken || !data?.user)
          return clearHandshake(
            response({ message: "No sign-in result. Please start again." }, 401),
          );
        return clearHandshake(setSession(response({ user: publicUser(data.user) }), data));
      }
      // Never redirect to an arbitrary URL supplied by an upstream response.
      if (data?.authorizationUrl !== "/oauth2/authorization/google")
        return response({ message: "Unexpected Google authorization route." }, 502);
      const handshake = upstream.headers
        .getSetCookie()
        .find((value) => value.startsWith("JSESSIONID="));
      const id = handshake?.split(";")[0].slice("JSESSIONID=".length);
      if (!id) return response({ message: "Google session could not be started." }, 502);
      const result = response({
        authorizationUrl: new URL(data.authorizationUrl, apiOrigin).toString(),
      });
      result.cookies.set("JSESSIONID", id, {
        ...cookieOptions,
        path: "/",
        maxAge: 300,
        secure: cookieOptions.secure || /;\s*secure(?:;|$)/i.test(handshake!),
      });
      result.cookies.set("lf_google_pending", "1", { ...cookieOptions, maxAge: 300 });
      return result;
    }
    if (action === "login" || action === "register") {
      let body;
      try {
        body = await request.json();
      } catch {
        return response({ message: "Invalid request" }, 400);
      }
      if (
        !body ||
        typeof body.email !== "string" ||
        typeof body.password !== "string" ||
        !body.email.trim() ||
        !body.password
      )
        return response({ message: "Invalid credentials" }, 400);
      const payload: Record<string, string> = { email: body.email.trim(), password: body.password };
      if (action === "register") {
        if (
          typeof body.name !== "string" ||
          !body.name.trim() ||
          body.name.length > 255 ||
          body.email.length > 255 ||
          !validPassword(body.password) ||
          (body.phone != null && (typeof body.phone !== "string" || body.phone.length > 50))
        )
          return response({ message: "Invalid registration details" }, 400);
        payload.name = body.name.trim();
        if (body.phone?.trim()) payload.phone = body.phone.trim();
      }
      const upstream = await backend(`auth/${action}`, payload);
      if (!upstream.ok) return response({ message: "Authentication failed" }, upstream.status);
      const { data } = (await upstream.json()) as { data: Tokens };
      return setSession(
        response({ user: publicUser(data.user) }, action === "register" ? 201 : 200),
        data,
      );
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
    if (!tokens && (!profile || [401, 403].includes(profile.status)))
      return clearSession(response({ user: null }, 401));
    if (!tokens && !profile?.ok) return response({ message: "Session service unavailable" }, 503);
    if (action === "update-profile") {
      const finish = (result: NextResponse) => (tokens ? setSession(result, tokens) : result);
      try {
        if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024)
          return finish(response({ message: "Photo must be no larger than 5 MB." }, 413));
        const form = await request.formData();
        const part = form.get("profile");
        if (!part) return finish(response({ message: "Missing profile details." }, 400));
        const profile = JSON.parse(typeof part === "string" ? part : await part.text());
        const invalid = validateProfile(profile);
        if (invalid) return finish(response({ message: invalid }, 400));
        const avatars = form.getAll("avatar");
        if (avatars.length > 1 || avatars.some((file) => typeof file === "string"))
          return finish(response({ message: "Choose one profile photo." }, 400));
        const photoError = validatePhotos(avatars as File[]);
        if (photoError || (profile.removePhoto && avatars.length))
          return finish(
            response({ message: photoError || "Choose either upload or remove photo." }, 400),
          );
        const payload = new FormData();
        // Explicit allowlist: callers cannot update email, role, ID or arbitrary photo URLs.
        payload.set(
          "profile",
          new Blob(
            [
              JSON.stringify({
                name: profile.name.trim(),
                phone: profile.phone.trim(),
                ...(profile.removePhoto ? { profilePhotoUrl: "" } : {}),
              }),
            ],
            { type: "application/json" },
          ),
        );
        if (avatars[0]) payload.set("avatar", avatars[0]);
        const upstream = await fetch(
          new URL("/api/users/me", process.env.API_BASE_URL || "http://localhost:8080"),
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${access}` },
            body: payload,
            cache: "no-store",
            signal: AbortSignal.timeout(60000),
          },
        );
        if (!upstream.ok)
          return finish(
            response(
              {
                message:
                  upstream.status === 413
                    ? "Photo must be no larger than 5 MB."
                    : "Could not update your profile. Please try again.",
              },
              upstream.status,
            ),
          );
        const { data } = await upstream.json();
        return finish(response({ user: publicUser(data) }));
      } catch (error) {
        return finish(
          response(
            {
              message:
                error instanceof SyntaxError
                  ? "Invalid profile details."
                  : "Could not confirm the update. Check your account before retrying.",
            },
            error instanceof SyntaxError ? 400 : 503,
          ),
        );
      }
    }
    if (action === "my-items" || action === "item-status") {
      const finish = (result: NextResponse) => (tokens ? setSession(result, tokens) : result);
      try {
        const body = await request.json();
        let path: string;
        let options: RequestInit;
        if (action === "my-items") {
          const page = body.page ?? 0;
          if (!Number.isInteger(page) || page < 0 || page > 100000)
            return finish(response({ message: "Invalid page." }, 400));
          path = `/api/items/my?page=${page}&size=12&sort=createdAt,desc`;
          options = { method: "GET" };
        } else {
          if (
            !/^[0-9a-f-]{36}$/i.test(body.id ?? "") ||
            !["RETURNED", "CLOSED"].includes(body.status)
          )
            return finish(response({ message: "Invalid status update." }, 400));
          path = `/api/items/${body.id}/status`;
          options = { method: "PATCH", body: JSON.stringify({ status: body.status }) };
        }
        const upstream = await fetch(
          new URL(path, process.env.API_BASE_URL || "http://localhost:8080"),
          {
            ...options,
            headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
            cache: "no-store",
            signal: AbortSignal.timeout(10000),
          },
        );
        if (!upstream.ok)
          return finish(
            response(
              {
                message:
                  upstream.status === 403
                    ? "You can only manage your own reports."
                    : "Could not load or update the report. Please refresh and try again.",
              },
              upstream.status,
            ),
          );
        return finish(response(await upstream.json()));
      } catch (error) {
        return finish(
          response(
            { message: "Could not complete the request. Refresh your reports before retrying." },
            error instanceof SyntaxError ? 400 : 503,
          ),
        );
      }
    }
    if (reporting) {
      const finish = (result: NextResponse) => (tokens ? setSession(result, tokens) : result);
      try {
        if (Number(request.headers.get("content-length")) > 51 * 1024 * 1024)
          return finish(response({ message: "Photos exceed the upload limit." }, 413));
        const form = await request.formData();
        const part = form.get("item");
        if (!part) return finish(response({ message: "Missing report details." }, 400));
        const item = JSON.parse(typeof part === "string" ? part : await part.text());
        const files = form.getAll("files");
        if (files.some((file) => typeof file === "string"))
          return finish(response({ message: "Invalid photo upload." }, 400));
        const editing = action === "edit-item";
        const id = form.get("id");
        if (editing && (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id)))
          return finish(response({ message: "Invalid report ID." }, 400));
        if (editing && item.replaceAllImages != null && typeof item.replaceAllImages !== "boolean")
          return finish(response({ message: "Invalid photo option." }, 400));
        const error = validateReport(item) || validatePhotos(files as File[]);
        if (error) return finish(response({ message: error }, 400));
        const payload = new FormData();
        // Type is immutable on edits and is not part of UpdateItemRequest.
        if (editing) delete item.type;
        payload.set("item", new Blob([JSON.stringify(item)], { type: "application/json" }));
        for (const file of files as File[]) payload.append("files", file);
        // Never retry a create automatically: the backend may already have saved it.
        const upstream = await fetch(
          new URL(
            editing ? `/api/items/${id}` : "/api/items",
            process.env.API_BASE_URL || "http://localhost:8080",
          ),
          {
            method: editing ? "PUT" : "POST",
            headers: { Authorization: `Bearer ${access}` },
            body: payload,
            cache: "no-store",
            signal: AbortSignal.timeout(60000),
          },
        );
        if (!upstream.ok)
          return finish(
            response(
              {
                message:
                  upstream.status === 413
                    ? "Photos exceed the upload limit."
                    : "Could not publish the report. Check your details and try again.",
              },
              upstream.status,
            ),
          );
        const result = await upstream.json();
        return finish(response({ data: result.data }, editing ? 200 : 201));
      } catch (error) {
        return finish(
          response(
            {
              message:
                error instanceof SyntaxError
                  ? "Invalid report or upload."
                  : "The result could not be confirmed. Check Browse items before submitting again.",
            },
            error instanceof SyntaxError ? 400 : 503,
          ),
        );
      }
    }
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
