// Fixed backend operations. Never accept an upstream path or method from the browser.
export const FEATURE_ACTIONS = [
  "saved-items",
  "save-item",
  "unsave-item",
  "notifications",
  "read-notification",
  "read-all-notifications",
  "submit-rating",
  "index-text",
  "index-photos",
  "admin-users",
  "admin-user",
  "admin-role",
  "admin-bans",
  "admin-ban",
  "admin-revoke",
  "create-category",
  "update-category",
  "delete-category",
] as const;
export const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export function featureRequest(action: string, body: Record<string, unknown>) {
  const page = body.page ?? 0;
  if (!Number.isInteger(page) || Number(page) < 0 || Number(page) > 100000)
    throw new Error("Invalid page.");
  const paging = `?page=${page}&size=20&sort=createdAt,desc`;
  const id = () => {
    if (!isUuid(body.id)) throw new Error("Invalid ID.");
    return body.id;
  };
  const reason = () => {
    if (typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 1000)
      throw new Error("Enter a reason of up to 1,000 characters.");
    return body.reason.trim();
  };
  let path = "";
  let method = "GET";
  let payload: object | undefined;
  switch (action) {
    case "saved-items":
      path = `/api/saved-items${paging}`;
      break;
    case "save-item":
      path = `/api/saved-items/${id()}`;
      method = "POST";
      break;
    case "unsave-item":
      path = `/api/saved-items/${id()}`;
      method = "DELETE";
      break;
    case "notifications":
      path = `/api/notifications${paging}`;
      break;
    case "read-notification":
      path = `/api/notifications/${id()}/read`;
      method = "PATCH";
      break;
    case "read-all-notifications":
      path = "/api/notifications/read-all";
      method = "PATCH";
      break;
    case "submit-rating":
      if (
        !isUuid(body.toUserId) ||
        !isUuid(body.itemId) ||
        !Number.isInteger(body.score) ||
        Number(body.score) < 1 ||
        Number(body.score) > 5 ||
        (body.comment != null && (typeof body.comment !== "string" || body.comment.length > 2000))
      )
        throw new Error("Choose a score from 1 to 5 and a comment of up to 2,000 characters.");
      path = "/api/ratings";
      method = "POST";
      payload = {
        toUserId: body.toUserId,
        itemId: body.itemId,
        score: body.score,
        comment: body.comment ?? "",
      };
      break;
    case "index-text":
      path = `/api/items/${id()}/embedding`;
      method = "POST";
      break;
    case "index-photos":
      path = `/api/items/${id()}/image-embeddings`;
      method = "POST";
      break;
    case "admin-users":
      if (body.q != null && (typeof body.q !== "string" || body.q.length > 255))
        throw new Error("Invalid search.");
      path = `/api/admin/users${paging}&q=${encodeURIComponent(String(body.q ?? ""))}`;
      break;
    case "admin-user":
      path = `/api/admin/users/${id()}`;
      break;
    case "admin-role":
      if (!["USER", "ADMIN"].includes(String(body.role))) throw new Error("Invalid role.");
      path = `/api/admin/users/${id()}/role`;
      method = "PATCH";
      payload = { role: body.role };
      break;
    case "admin-bans":
      path = `/api/admin/users/${id()}/bans${paging}`;
      break;
    case "admin-ban":
      if (
        body.expiresAt != null &&
        (typeof body.expiresAt !== "string" ||
          !Number.isFinite(Date.parse(body.expiresAt)) ||
          Date.parse(body.expiresAt) <= Date.now())
      )
        throw new Error("Ban expiry must be in the future.");
      path = `/api/admin/users/${id()}/bans`;
      method = "POST";
      payload = { reason: reason(), expiresAt: body.expiresAt ?? null };
      break;
    case "admin-revoke":
      if (!isUuid(body.banId)) throw new Error("Invalid ban ID.");
      path = `/api/admin/users/${id()}/bans/${body.banId}/revoke`;
      method = "POST";
      payload = { reason: reason() };
      break;
    case "create-category":
    case "update-category":
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.length > 100 ||
        (body.iconUrl != null && (typeof body.iconUrl !== "string" || body.iconUrl.length > 1024))
      )
        throw new Error(
          "Enter a category name of up to 100 characters and an icon URL of up to 1,024 characters.",
        );
      path = action === "create-category" ? "/api/categories" : `/api/categories/${id()}`;
      method = action === "create-category" ? "POST" : "PUT";
      payload = { name: body.name.trim(), iconUrl: body.iconUrl || null };
      break;
    case "delete-category":
      path = `/api/categories/${id()}`;
      method = "DELETE";
      break;
    default:
      throw new Error("Unknown action.");
  }
  return { path, method, payload };
}

export function featureError(status: number) {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "This record is no longer available. Refresh and try again.";
  if (status === 409)
    return "This conflicts with the current record. It may already exist, be in use, or have changed. Refresh before retrying.";
  if (status === 400)
    return "The request could not be accepted. Check your details and the current record.";
  if (status === 429) return "Too many requests. Please wait before trying again.";
  return "Could not confirm the request. Refresh before retrying.";
}
