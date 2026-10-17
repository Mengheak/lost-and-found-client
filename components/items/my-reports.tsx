"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Pencil, Plus, X } from "lucide-react";
import { useSessionQuery, useMyItemsQuery, useItemStatusMutation } from "@/store/api/auth-api";
import { itemsApi } from "@/store/api/items-api";
import { useAppDispatch } from "@/store/hooks";
import type { Item } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ItemCard } from "@/components/items/item-card";
import { ReportItemForm } from "@/components/items/report-item-form";

export function MyReports() {
  const session = useSessionQuery();
  if (session.isLoading)
    return (
      <div className="container page-stack" role="status">
        Checking your session…
      </div>
    );
  if (!session.data?.user)
    return (
      <section className="container page-stack">
        <h1>My reports</h1>
        {session.isError && !("status" in session.error && session.error.status === 401) ? (
          <>
            <p>Could not check your session.</p>
            <Button onClick={() => session.refetch()}>Retry</Button>
          </>
        ) : (
          <>
            <p>Sign in to manage your reports.</p>
            <Link href="/login">Sign in</Link>
          </>
        )}
      </section>
    );
  return <ReportsList key={session.data.user.id} userId={session.data.user.id} />;
}

function ReportsList({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const reports = useMyItemsQuery({ page, userId });
  const [editing, setEditing] = useState<Item | null>(null);
  const [pending, setPending] = useState<{ item: Item; status: "RETURNED" | "CLOSED" } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [changeStatus, { isLoading }] = useItemStatusMutation();
  const dispatch = useAppDispatch();

  async function confirm() {
    if (!pending || isLoading) return;
    setError("");
    try {
      await changeStatus({ id: pending.item.id, status: pending.status }).unwrap();
      dispatch(itemsApi.util.resetApiState());
      setMessage(pending.status === "RETURNED" ? "Report marked as returned." : "Report closed.");
      setPending(null);
    } catch {
      setError(
        "Could not confirm the update. Refresh your reports before trying again. You must be signed in as the owner.",
      );
    }
  }

  if (editing)
    return (
      <ReportItemForm
        key={editing.id}
        initialItem={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setMessage("Report updated.");
        }}
      />
    );
  return (
    <section className="container page-stack">
      <div className="hero">
        <p className="eyebrow">Your lost and found items</p>
        <h1>My reports</h1>
        <p className="muted">Update details and close the loop when an item makes it home.</p>
        <Link className="ui-button ui-button--primary" href="/items/report">
          <Plus size={18} />
          Report an item
        </Link>
      </div>
      {message && <p role="status">{message}</p>}
      {reports.isFetching && <p role="status">Loading your reports…</p>}
      {reports.isError ? (
        <div role="alert" className="section-stack">
          <p>Could not load your reports. Your session may have expired.</p>
          <div className="row">
            <Button onClick={() => reports.refetch()}>Retry</Button>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      ) : (
        reports.currentData && (
          <>
            {reports.currentData.content.length === 0 ? (
              <p>
                {page === 0
                  ? "You haven’t reported any items yet."
                  : "No reports on this page. Go back to see earlier results."}
              </p>
            ) : (
              <div className="responsive-grid">
                {reports.currentData.content.map((item) => (
                  <div key={item.id} className="section-stack">
                    <ItemCard item={item} />
                    <div className="row">
                      <Button variant="secondary" onClick={() => setEditing(item)}>
                        <Pencil size={18} />
                        Edit
                      </Button>
                      {item.status === "OPEN" && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setError("");
                              setPending({ item, status: "RETURNED" });
                            }}
                          >
                            <Check size={18} />
                            Mark returned
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setError("");
                              setPending({ item, status: "CLOSED" });
                            }}
                          >
                            <X size={18} />
                            Close report
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )
      )}
      <nav className="row" aria-label="Report pages">
        <Button
          variant="secondary"
          disabled={page === 0 || reports.isFetching}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <span>Page {page + 1}</span>
        <Button
          variant="secondary"
          disabled={
            !reports.currentData ||
            reports.currentData.last ||
            reports.isFetching ||
            reports.isError
          }
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </nav>
      <ConfirmationModal
        open={!!pending}
        title={
          pending?.status === "RETURNED" ? "Mark this item as returned?" : "Close this report?"
        }
        confirmLabel={pending?.status === "RETURNED" ? "Mark returned" : "Close report"}
        busy={isLoading}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      >
        <p>{pending?.item.name}</p>
        <p className="muted">
          {pending?.status === "RETURNED"
            ? "Confirm that this item has been returned to its owner."
            : "This report will no longer be marked as open."}
        </p>
        {error && (
          <p role="alert" className="field-error">
            {error}
          </p>
        )}
      </ConfirmationModal>
    </section>
  );
}
