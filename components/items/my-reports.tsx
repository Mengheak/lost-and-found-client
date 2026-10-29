"use client";

import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  LogIn,
  CalendarDays,
  Check,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { useState } from "react";
import Link from "next/link";

import { IconLink } from "@/components/ui/icon-link";

import {
  useSessionQuery,
  useMyItemsQuery,
  useItemStatusMutation,
  useDeleteItemMutation,
} from "@/store/api/auth-api";
import { itemsApi } from "@/store/api/items-api";
import { useAppDispatch } from "@/store/hooks";
import { formatItemDate, itemLocation, STATUS_LABELS, type Item } from "@/lib/items";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ItemPhoto } from "@/components/items/item-photo";
import { ReportItemForm } from "@/components/items/report-item-form";
import { IndexItem } from "@/components/community/index-item";

export function MyReports() {
  const session = useSessionQuery();
  if (session.isLoading)
    return (
      <div className="container page-stack" role="status">
        Checking your session…
      </div>
    );
  if (session.isError || !session.data?.user)
    return (
      <section className="container page-stack">
        <h1>My reports</h1>
        {session.isError && !("status" in session.error && session.error.status === 401) ? (
          <>
            <p>Could not check your session.</p>
            <Button onClick={() => session.refetch()} iconLabel="Retry">
              <RotateCcw size={18} aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <p>Sign in to manage your reports.</p>
            <IconLink href="/login" label="Sign in">
              <LogIn size={18} aria-hidden="true" />
            </IconLink>
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
  const [pending, setPending] = useState<{
    item: Item;
    status: "OPEN" | "RETURNED" | "CLOSED" | "DELETE";
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [changeStatus, { isLoading: isUpdating }] = useItemStatusMutation();
  const [deleteItem, { isLoading: isDeleting }] = useDeleteItemMutation();
  const isLoading = isUpdating || isDeleting;
  const dispatch = useAppDispatch();

  async function confirm() {
    if (!pending || isLoading) return;
    setError("");
    try {
      if (pending.status === "DELETE") {
        await deleteItem({ id: pending.item.id }).unwrap();
        if (page > 0 && reports.currentData?.content.length === 1) setPage(page - 1);
      } else {
        await changeStatus({ id: pending.item.id, status: pending.status }).unwrap();
      }
      dispatch(itemsApi.util.resetApiState());
      setMessage(
        pending.status === "DELETE"
          ? "Report deleted."
          : pending.status === "RETURNED"
            ? "Report marked as returned."
            : pending.status === "OPEN"
              ? "Report reopened."
              : "Report closed.",
      );
      setPending(null);
    } catch {
      setError(
        pending.status === "DELETE"
          ? "Could not confirm deletion. Refresh your reports before trying again. You must be signed in as the owner."
          : "Could not confirm the update. Refresh your reports before trying again. You must be signed in as the owner.",
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
      <div className="reports-header">
        <div className="hero">
          <p className="eyebrow">Your lost and found items</p>
          <h1>My reports</h1>
          <p className="muted">Update details and close the loop when an item makes it home.</p>
        </div>
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
            <Button onClick={() => reports.refetch()} iconLabel="Retry">
              <RotateCcw size={18} aria-hidden="true" />
            </Button>
            <IconLink href="/login" label="Sign in">
              <LogIn size={18} aria-hidden="true" />
            </IconLink>
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
              <ul className="reports-list" aria-label="Your reports" aria-busy={reports.isFetching}>
                {reports.currentData.content.map((item) => (
                  <li key={item.id} className="report-row">
                    <Link href={`/items/${item.id}`} className="report-row-main">
                      <div className="report-row-photo">
                        <ItemPhoto src={item.photoUrls?.[0]} alt="" />
                      </div>
                      <div className="report-row-copy">
                        <div className="row">
                          <Badge tone={item.type === "LOST" ? "lost" : "found"}>
                            {item.type === "LOST" ? "Lost" : "Found"}
                          </Badge>
                          <Badge>{STATUS_LABELS[item.status]}</Badge>
                        </div>
                        <h2>{item.name}</h2>
                        <p className="muted">{item.category?.name || "Uncategorized"}</p>
                        <div className="report-row-meta">
                          <span className="item-meta">
                            <MapPin size={16} aria-hidden="true" />
                            {itemLocation(item)}
                          </span>
                          <span className="item-meta">
                            <CalendarDays size={16} aria-hidden="true" />
                            {formatItemDate(item.dateTime || item.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <div
                      className="report-row-actions"
                      role="group"
                      aria-label={`Manage ${item.name}`}
                    >
                      <Button
                        variant="secondary"
                        disabled={isLoading}
                        onClick={() => setEditing(item)}
                        iconLabel="Edit"
                      >
                        <Pencil size={18} />
                      </Button>
                      {item.status !== "OPEN" && (
                        <Button
                          variant="secondary"
                          disabled={isLoading}
                          onClick={() => {
                            setError("");
                            setPending({ item, status: "OPEN" });
                          }}
                        >
                          Reopen report
                        </Button>
                      )}
                      {item.status === "CLOSED" && (
                        <Button
                          variant="secondary"
                          disabled={isLoading}
                          onClick={() => {
                            setError("");
                            setPending({ item, status: "RETURNED" });
                          }}
                        >
                          Mark returned
                        </Button>
                      )}
                      {item.status === "RETURNED" && (
                        <Button
                          variant="secondary"
                          disabled={isLoading}
                          onClick={() => {
                            setError("");
                            setPending({ item, status: "CLOSED" });
                          }}
                        >
                          Close report
                        </Button>
                      )}
                      {item.status === "OPEN" && (
                        <>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setError("");
                              setPending({ item, status: "RETURNED" });
                            }}
                            iconLabel="Mark returned"
                          >
                            <Check size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setError("");
                              setPending({ item, status: "CLOSED" });
                            }}
                            iconLabel="Close report"
                          >
                            <X size={18} />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        className="report-delete"
                        disabled={isLoading}
                        onClick={() => {
                          setError("");
                          setMessage("");
                          setPending({ item, status: "DELETE" });
                        }}
                        iconLabel="Delete"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </Button>
                    </div>
                    <IndexItem id={item.id} hasPhotos={!!item.photoUrls?.length} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}
      <nav className="row" aria-label="Report pages">
        <Button
          variant="secondary"
          disabled={page === 0 || reports.isFetching}
          onClick={() => setPage(page - 1)}
          iconLabel="Previous"
        >
          <ChevronLeft size={18} aria-hidden="true" />
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
          iconLabel="Next"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </Button>
      </nav>
      <ConfirmationModal
        open={!!pending}
        title={
          pending?.status === "DELETE"
            ? "Delete this report?"
            : pending?.status === "RETURNED"
              ? "Mark this item as returned?"
              : pending?.status === "OPEN"
                ? "Reopen this report?"
                : "Close this report?"
        }
        confirmLabel={
          pending?.status === "DELETE"
            ? "Delete report"
            : pending?.status === "RETURNED"
              ? "Mark returned"
              : pending?.status === "OPEN"
                ? "Reopen report"
                : "Close report"
        }
        destructive={pending?.status === "DELETE"}
        busy={isLoading}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      >
        <p>{pending?.item.name}</p>
        <p className="muted">
          {pending?.status === "DELETE"
            ? "This will permanently delete your report. This action cannot be undone."
            : pending?.status === "RETURNED"
              ? "Confirm that this item has been returned to its owner."
              : pending?.status === "OPEN"
                ? "This report will be open again. Its previous return date will be cleared."
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
