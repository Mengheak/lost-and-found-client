import { photoSearchError, validateSearchPhoto } from "@/lib/photo-search";
import { MAX_PHOTO_BYTES } from "@/lib/report-item";

function failure(message: string, status: number) {
  return Response.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return failure("Please search from this website.", 403);
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    return failure("Choose a photo to search.", 415);
  // Reject large declared bodies before parsing. The file is checked again below.
  if (Number(request.headers.get("content-length")) > MAX_PHOTO_BYTES + 64 * 1024)
    return failure(photoSearchError(413), 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure("The photo could not be read. Please choose it again.", 400);
  }
  const files = form.getAll("file");
  if (files.some((file) => !(file instanceof File)))
    return failure("Choose one photo to search.", 400);
  const error = validateSearchPhoto(files as File[]);
  if (error) return failure(error, 400);
  const categoryId = form.get("categoryId");
  if (
    categoryId !== null &&
    (typeof categoryId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(categoryId))
  )
    return failure("Choose a valid category.", 400);

  const body = new FormData();
  // Forward only supported fields, without cookies or credentials.
  body.set("file", files[0] as File, "search-photo");
  body.set("limit", "20");
  if (categoryId) body.set("categoryId", categoryId);
  try {
    const upstream = await fetch(
      new URL("/api/items/search/photo", process.env.API_BASE_URL || "http://localhost:8080"),
      {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(60000)]),
      },
    );
    if (!upstream.ok) return failure(photoSearchError(upstream.status), upstream.status);
    const result = await upstream.json();
    if (result.success !== true || !Array.isArray(result.data?.matches))
      return failure(photoSearchError(503), 503);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure(photoSearchError(503), 503);
  }
}
