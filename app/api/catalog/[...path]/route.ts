import type { NextRequest } from "next/server";

// Read-only, fixed-origin proxy: no credentials or arbitrary destinations forwarded.
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const valid =
    (path.length === 1 && ["items", "categories"].includes(path[0])) ||
    (path.length === 2 &&
      ["items", "users", "categories"].includes(path[0]) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path[1])) ||
    (path.length === 3 &&
      path[0] === "ratings" &&
      path[1] === "user" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path[2]));
  if (!valid) return Response.json({ success: false, message: "Not found" }, { status: 404 });
  try {
    const origin = process.env.API_BASE_URL || "http://localhost:8080";
    const url = new URL(`/api/${path.join("/")}`, origin);
    for (const key of [
      "q",
      "type",
      "categoryId",
      "status",
      "page",
      "size",
      "sort",
      "brand",
      "color",
      "dateFrom",
      "dateTo",
    ]) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null) url.searchParams.set(key, value);
    }
    const upstream = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });
    const data = await upstream.json();
    return Response.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { success: false, message: "The item service is temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }
}
