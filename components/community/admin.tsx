"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  useAdminUsersQuery,
  useAdminUserQuery,
  useAdminBansQuery,
  useAdminChangeMutation,
} from "@/store/api/community-api";
import { useGetCategoriesQuery } from "@/store/api/items-api";
import { requestError } from "@/lib/community";
import { formatItemDate, type Category } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { SessionGate, Pagination, LoadError } from "./shared";

type Change = Parameters<ReturnType<typeof useAdminChangeMutation>[0]>[0];
export function Admin() {
  return (
    <section className="container page-stack">
      <header className="hero">
        <p className="eyebrow">Administration</p>
        <h1>Community management</h1>
        <p className="muted">Manage users, moderation, and report categories.</p>
      </header>
      <SessionGate admin>{(user) => <AdminContent key={user.id} userId={user.id} />}</SessionGate>
    </section>
  );
}
function AdminContent({ userId }: { userId: string }) {
  const [tab, setTab] = useState("users");
  const [selected, setSelected] = useState("");
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const list = useAdminUsersQuery({ page, userId, q }, { skip: tab !== "users" });
  return (
    <div className="section-stack">
      <div className="row" role="group" aria-label="Administration sections">
        <Button variant={tab === "users" ? "primary" : "secondary"} onClick={() => setTab("users")}>
          Users
        </Button>
        <Button
          variant={tab === "categories" ? "primary" : "secondary"}
          onClick={() => setTab("categories")}
        >
          Categories
        </Button>
      </div>
      {tab === "categories" ? (
        <Categories />
      ) : selected ? (
        <UserDetail key={selected} id={selected} userId={userId} back={() => setSelected("")} />
      ) : (
        <>
          <form
            className="row"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(String(new FormData(e.currentTarget).get("q") || ""));
              setPage(0);
            }}
          >
            <Input
              label="Search users by name or email"
              name="q"
              type="search"
              maxLength={255}
              defaultValue={q}
            />
            <Button type="submit">Search</Button>
          </form>
          {list.isFetching && <p role="status">Loading users…</p>}
          {list.isError ? (
            <LoadError retry={() => list.refetch()} />
          ) : (
            list.currentData && (
              <>
                <p>{list.currentData.totalElements} users</p>
                <ul className="activity-list">
                  {list.currentData.content.map((user) => (
                    <li className="activity-card" key={user.id}>
                      <h2>{user.name}</h2>
                      <p>
                        {user.email} · {user.role}
                      </p>
                      <Button variant="secondary" onClick={() => setSelected(user.id)}>
                        Manage {user.name}
                      </Button>
                    </li>
                  ))}
                </ul>
                {!list.currentData.content.length && <p>No users found.</p>}
              </>
            )
          )}
          <Pagination
            page={page}
            last={!list.currentData || list.currentData.last || list.isError}
            busy={list.isFetching}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
function UserDetail({ id, userId, back }: { id: string; userId: string; back: () => void }) {
  const profile = useAdminUserQuery({ id, userId });
  const [page, setPage] = useState(0);
  const bans = useAdminBansQuery({ id, userId, page });
  const [change, state] = useAdminChangeMutation();
  const [pending, setPending] = useState<Change | null>(null);
  const [message, setMessage] = useState("");
  const user = profile.currentData;
  const canManage = user && id !== userId;
  async function confirm() {
    if (!pending) return;
    setMessage("");
    try {
      await change(pending).unwrap();
      setPending(null);
      setMessage("User updated.");
    } catch (error) {
      setMessage(requestError(error));
    }
  }
  function ban(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const expiry = String(data.get("expiresAt") || "");
    if (expiry && new Date(expiry).getTime() <= Date.now()) {
      setMessage("Choose a future expiry.");
      return;
    }
    setMessage("");
    setPending({
      action: "admin-ban",
      id,
      reason: String(data.get("reason")),
      expiresAt: expiry ? new Date(expiry).toISOString() : null,
    });
  }
  return (
    <div className="section-stack">
      <Button variant="ghost" onClick={back}>
        Back to users
      </Button>
      {profile.isFetching && <p role="status">Loading user…</p>}
      {profile.isError ? (
        <LoadError retry={() => profile.refetch()} />
      ) : (
        user && (
          <>
            <h2>{user.name}</h2>
            <dl className="item-facts">
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{user.phone || "Not provided"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{user.role}</dd>
              </div>
              <div>
                <dt>Moderation</dt>
                <dd>
                  {user.banned
                    ? `Banned · ${user.banExpiresAt ? `until ${formatItemDate(user.banExpiresAt)}` : "permanently"}`
                    : "Active"}
                </dd>
              </div>
            </dl>
            <Link href={`/users/${id}`}>View public profile</Link>
            {canManage && (
              <Button
                variant="secondary"
                disabled={user.banned || state.isLoading}
                onClick={() => {
                  setMessage("");
                  setPending({
                    action: "admin-role",
                    id,
                    role: user.role === "ADMIN" ? "USER" : "ADMIN",
                  });
                }}
              >
                Change role to {user.role === "ADMIN" ? "USER" : "ADMIN"}
              </Button>
            )}
            {canManage && user.role !== "ADMIN" && !user.banned && (
              <form onSubmit={ban} className="section-stack feature-form">
                <h3>Ban user</h3>
                <Input label="Reason" name="reason" required maxLength={1000} />
                <Input
                  label="Expiry (optional; blank means permanent)"
                  name="expiresAt"
                  type="datetime-local"
                />
                <Button variant="danger" type="submit" disabled={state.isLoading}>
                  Review ban
                </Button>
              </form>
            )}
          </>
        )
      )}
      {message && <p role="status">{message}</p>}
      <h3>Ban history</h3>
      {bans.isFetching && <p role="status">Loading history…</p>}
      {bans.isError ? (
        <LoadError retry={() => bans.refetch()} />
      ) : (
        bans.currentData && (
          <>
            <ul className="activity-list">
              {bans.currentData.content.map((b) => (
                <li className="activity-card" key={b.id}>
                  <strong>{b.active ? "Active ban" : b.revokedAt ? "Revoked" : "Expired"}</strong>
                  <p>{b.reason}</p>
                  <p className="muted">
                    Created {formatItemDate(b.createdAt)} · Expires{" "}
                    {b.expiresAt ? formatItemDate(b.expiresAt) : "never"}
                  </p>
                  {b.revokedAt && (
                    <p>
                      Revoked {formatItemDate(b.revokedAt)}: {b.revocationReason}
                    </p>
                  )}
                  {b.active && canManage && !profile.isError && (
                    <form
                      className="row"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setMessage("");
                        setPending({
                          action: "admin-revoke",
                          id,
                          banId: b.id,
                          reason: String(new FormData(e.currentTarget).get("reason")),
                        });
                      }}
                    >
                      <Input
                        label="Reason for revoking ban"
                        name="reason"
                        required
                        maxLength={1000}
                      />
                      <Button type="submit" variant="secondary" disabled={state.isLoading}>
                        Review revocation
                      </Button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            {!bans.currentData.content.length && <p>No bans on this page.</p>}
          </>
        )
      )}
      <Pagination
        page={page}
        last={!bans.currentData || bans.currentData.last || bans.isError}
        busy={bans.isFetching}
        onChange={setPage}
      />
      <ConfirmationModal
        open={!!pending}
        title="Confirm user change"
        confirmLabel="Apply change"
        busy={state.isLoading}
        destructive={pending?.action === "admin-ban"}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      >
        <p>{user?.name}</p>
        <p>
          {pending?.action === "admin-role"
            ? `Set role to ${pending.role}. Existing sessions will end.`
            : pending?.action === "admin-ban"
              ? `Ban ${pending.expiresAt ? `until ${new Date(pending.expiresAt).toLocaleString()}` : "permanently"}. Existing sessions will end.`
              : "Revoke this ban and allow sign-in again."}
        </p>
        {pending?.reason && <p>Reason: {pending.reason}</p>}
        {message && <p role="alert">{message}</p>}
      </ConfirmationModal>
    </div>
  );
}
function Categories() {
  const categories = useGetCategoriesQuery();
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [change, state] = useAdminChangeMutation();
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage("");
    try {
      await change({
        action: editing ? "update-category" : "create-category",
        ...(editing ? { id: editing.id } : {}),
        name: String(data.get("name")),
        iconUrl: String(data.get("iconUrl") || ""),
      }).unwrap();
      setEditing(null);
      form.reset();
      setMessage("Category saved.");
    } catch (error) {
      setMessage(requestError(error));
    }
  }
  return (
    <section className="section-stack">
      <h2>Report categories</h2>
      <form key={editing?.id || "new"} className="section-stack feature-form" onSubmit={save}>
        <h3>{editing ? "Edit category" : "Add category"}</h3>
        <Input
          label="Category name"
          name="name"
          required
          maxLength={100}
          defaultValue={editing?.name || ""}
        />
        <Input
          label="Icon URL (optional)"
          type="url"
          name="iconUrl"
          maxLength={1024}
          defaultValue={editing?.iconUrl || ""}
        />
        <div className="row">
          <Button type="submit" loading={state.isLoading}>
            Save category
          </Button>
          {editing && (
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          )}
        </div>
      </form>
      {message && <p role="status">{message}</p>}
      {categories.isFetching && <p role="status">Loading categories…</p>}
      {categories.isError ? (
        <LoadError retry={() => categories.refetch()} />
      ) : (
        <ul className="activity-list">
          {categories.data?.map((c) => (
            <li key={c.id} className="activity-card">
              <h3>{c.name}</h3>
              {c.iconUrl && <p className="muted break-text">{c.iconUrl}</p>}
              <div className="row">
                <Button
                  variant="secondary"
                  disabled={state.isLoading}
                  onClick={() => {
                    setEditing(c);
                    setMessage("");
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  disabled={state.isLoading}
                  onClick={() => {
                    setDeleting(c);
                    setMessage("");
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmationModal
        open={!!deleting}
        title="Delete category?"
        confirmLabel="Delete category"
        destructive
        busy={state.isLoading}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await change({ action: "delete-category", id: deleting.id }).unwrap();
            if (editing?.id === deleting.id) setEditing(null);
            setDeleting(null);
            setMessage("Category deleted.");
          } catch (error) {
            setMessage(requestError(error));
          }
        }}
      >
        <p>{deleting?.name}. Categories in use may be rejected by the backend.</p>
        {message && <p role="alert">{message}</p>}
      </ConfirmationModal>
    </section>
  );
}
