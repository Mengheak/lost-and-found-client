"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  usePublicProfileQuery,
  useRatingsQuery,
  useSubmitRatingMutation,
} from "@/store/api/community-api";
import { useSessionQuery } from "@/store/api/auth-api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatItemDate } from "@/lib/items";
import { requestError } from "@/lib/community";
import { isUuid } from "@/lib/feature-actions";
import { Pagination, LoadError } from "./shared";

export function PublicProfile({ id }: { id: string }) {
  const [page, setPage] = useState(0);
  const valid = isUuid(id);
  const profile = usePublicProfileQuery(id, { skip: !valid, refetchOnMountOrArgChange: true });
  const ratings = useRatingsQuery({ id, page }, { skip: !valid, refetchOnMountOrArgChange: true });
  const user = profile.currentData;
  return (
    <section className="container page-stack">
      <Link href="/items">Back to items</Link>
      {!valid || (profile.error && "status" in profile.error && profile.error.status === 404) ? (
        <h1>Member not found</h1>
      ) : profile.isError ? (
        <LoadError retry={() => profile.refetch()} />
      ) : !user ? (
        <p role="status">Loading profile…</p>
      ) : (
        <>
          <header className="hero">
            <Avatar name={user.name} src={user.profilePhotoUrl} size="lg" />
            <h1>{user.name}</h1>
            <p className="muted">Member since {formatItemDate(user.memberSince)}</p>
            <p>
              {user.ratingAvg > 0
                ? `${user.ratingAvg.toFixed(1)} / 5 average rating`
                : "No ratings yet"}
            </p>
          </header>
          <section className="section-stack">
            <h2>Community reviews</h2>
            {ratings.isFetching && <p role="status">Loading reviews…</p>}
            {ratings.isError ? (
              <LoadError retry={() => ratings.refetch()} />
            ) : (
              ratings.currentData && (
                <>
                  {!ratings.currentData.content.length && <p>No reviews on this page yet.</p>}
                  <ul className="activity-list">
                    {ratings.currentData.content.map((r) => (
                      <li key={r.id} className="activity-card">
                        <div className="row">
                          <Link href={`/users/${r.fromUser.id}`}>{r.fromUser.name}</Link>
                          <strong>{r.score} / 5</strong>
                        </div>
                        {r.comment && <p className="preserve-lines">{r.comment}</p>}
                        <Link href={`/items/${r.itemId}`}>View related report</Link>
                        <time className="muted" dateTime={r.createdAt}>
                          {formatItemDate(r.createdAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                </>
              )
            )}
            <Pagination
              page={page}
              last={!ratings.currentData || ratings.currentData.last || ratings.isError}
              busy={ratings.isFetching}
              onChange={setPage}
            />
          </section>
        </>
      )}
    </section>
  );
}

export function RatingForm({
  itemId,
  toUserId,
  name,
}: {
  itemId: string;
  toUserId: string;
  name: string;
}) {
  const session = useSessionQuery();
  const [submitRating, state] = useSubmitRatingMutation();
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  if (session.isLoading || session.data?.user?.id === toUserId) return null;
  if (!session.data?.user || session.isError)
    return <Link href="/login">Sign in to leave a review</Link>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.isLoading) return;
    const form = new FormData(event.currentTarget);
    setMessage("");
    try {
      await submitRating({
        itemId,
        toUserId,
        score: Number(form.get("score")),
        comment: String(form.get("comment") || "").trim(),
      }).unwrap();
      setDone(true);
      setMessage("Your review has been submitted.");
    } catch (error) {
      setMessage(requestError(error));
    }
  }
  return (
    <section className="section-stack">
      <h2>Review your experience with {name}</h2>
      {!done && (
        <form className="section-stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="rating-score">Rating</label>
            <select id="rating-score" name="score" className="ui-input" required defaultValue="">
              <option value="" disabled>
                Choose a rating
              </option>
              {[5, 4, 3, 2, 1].map((score) => (
                <option key={score} value={score}>
                  {score} / 5
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rating-comment">Comment (optional)</label>
            <textarea
              id="rating-comment"
              name="comment"
              className="ui-input"
              rows={3}
              maxLength={2000}
            />
          </div>
          <Button type="submit" loading={state.isLoading}>
            Submit review
          </Button>
        </form>
      )}
      {message && <p role={done ? "status" : "alert"}>{message}</p>}
    </section>
  );
}
