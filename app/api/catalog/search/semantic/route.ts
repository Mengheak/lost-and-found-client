import { NextRequest } from "next/server";
import { isUuid } from "@/lib/feature-actions";

export async function POST(request: NextRequest) {
  const reply = (body: object, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (
    request.headers.get("origin") !== request.nextUrl.origin ||
    !request.headers.get("content-type")?.startsWith("application/json")
  )
    return reply({ message: "Request not permitted." }, 403);
  try {
    const body = await request.json();
    if (
      typeof body?.query !== "string" ||
      !body.query.trim() ||
      body.query.length > 2000 ||
      (body.categoryId && !isUuid(body.categoryId)) ||
      (body.minScore != null &&
        (typeof body.minScore !== "number" ||
          !Number.isFinite(body.minScore) ||
          body.minScore < -1 ||
          body.minScore > 1))
    )
      return reply(
        {
          message:
            "Enter a description of up to 2,000 characters and a valid similarity threshold.",
        },
        400,
      );
    const upstream = await fetch(
      new URL("/api/items/search/semantic", process.env.API_BASE_URL || "http://localhost:8080"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: body.query.trim(),
          limit: 20,
          ...(body.categoryId ? { categoryId: body.categoryId } : {}),
          ...(body.minScore != null ? { minScore: body.minScore } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(60000),
      },
    );
    if (!upstream.ok)
      return reply(
        {
          message:
            upstream.status === 429
              ? "Too many searches. Please wait and try again."
              : "Smart search is temporarily unavailable. Please try again.",
        },
        upstream.status,
      );
    return reply(await upstream.json());
  } catch (error) {
    return reply(
      {
        message:
          error instanceof SyntaxError
            ? "Invalid search."
            : "Smart search is temporarily unavailable.",
      },
      error instanceof SyntaxError ? 400 : 503,
    );
  }
}
