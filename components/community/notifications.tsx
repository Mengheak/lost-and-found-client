"use client";
import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationsQuery, useReadNotificationMutation } from "@/store/api/community-api";
import { formatItemDate } from "@/lib/items";
import { requestError } from "@/lib/community";
import { SessionGate, Pagination, LoadError } from "./shared";

export function NotificationLink({ userId }: { userId: string }) {
  const feed = useNotificationsQuery(
    { page: 0, userId },
    { pollingInterval: 30000, skipPollingIfUnfocused: true },
  );
  const unread = feed.isError
    ? 0
    : (feed.currentData?.content.filter((n) => !n.isRead).length ?? 0);
  return (
    <Link
      className="nav-link"
      href="/notifications"
      aria-label={unread ? `Notifications, ${unread} unread on the latest page` : "Notifications"}
      title="Notifications"
    >
      <Bell size={18} aria-hidden="true" />
      {unread > 0 && <span className="ui-badge">{unread}+</span>}
    </Link>
  );
}
export function Notifications() {
  return (
    <section className="container page-stack">
      <header className="hero">
        <p className="eyebrow">Community activity</p>
        <h1>Notifications</h1>
        <p className="muted">Messages, saved reports, and reviews from your community.</p>
      </header>
      <SessionGate>{(user) => <Feed key={user.id} userId={user.id} />}</SessionGate>
    </section>
  );
}
function Feed({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const feed = useNotificationsQuery(
    { page, userId },
    { pollingInterval: 30000, skipPollingIfUnfocused: true },
  );
  const [read, state] = useReadNotificationMutation();
  const [message, setMessage] = useState("");
  async function mark(id?: string) {
    setMessage("");
    try {
      await read(id).unwrap();
      setMessage(id ? "Notification marked as read." : "All notifications marked as read.");
    } catch (error) {
      setMessage(requestError(error));
    }
  }
  return (
    <div className="section-stack">
      <div className="row">
        <Button
          variant="secondary"
          loading={state.isLoading}
          disabled={feed.isError || !feed.currentData}
          onClick={() => mark()}
        >
          Mark all as read
        </Button>
        <Button variant="ghost" disabled={feed.isFetching} onClick={() => feed.refetch()}>
          Refresh
        </Button>
      </div>
      {message && <p role="status">{message}</p>}
      {feed.isFetching && <p role="status">Loading notifications…</p>}
      {feed.isError ? (
        <LoadError retry={() => feed.refetch()} />
      ) : (
        feed.currentData && (
          <>
            {!feed.currentData.content.length && <p>You have no notifications on this page.</p>}
            <ul className="activity-list">
              {feed.currentData.content.map((n) => (
                <li key={n.id} className={`activity-card${n.isRead ? "" : " activity-unread"}`}>
                  <p>{n.message}</p>
                  <time className="muted" dateTime={n.createdAt}>
                    {formatItemDate(n.createdAt)}
                  </time>
                  <div className="row">
                    {n.type === "NEW_MESSAGE" ? (
                      <Link href="/messages">Open messages</Link>
                    ) : n.type === "NEW_RATING" ? (
                      <Link href={`/users/${userId}`}>View reviews</Link>
                    ) : (
                      <Link href="/my-reports">View reports</Link>
                    )}
                    {n.isRead ? (
                      <span className="muted">Read</span>
                    ) : (
                      <Button
                        variant="secondary"
                        loading={state.isLoading}
                        onClick={() => mark(n.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )
      )}
      <Pagination
        page={page}
        last={!feed.currentData || feed.currentData.last || feed.isError}
        busy={feed.isFetching}
        onChange={setPage}
      />
    </div>
  );
}
