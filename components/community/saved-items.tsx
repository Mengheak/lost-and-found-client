"use client";
import { useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/items/item-card";
import { useSessionQuery } from "@/store/api/auth-api";
import {
  useSavedItemsQuery,
  useSaveItemMutation,
  useUnsaveItemMutation,
} from "@/store/api/community-api";
import { requestError } from "@/lib/community";
import { SessionGate, Pagination, LoadError } from "./shared";

export function SaveItem({ id }: { id: string }) {
  const session = useSessionQuery();
  const [save, state] = useSaveItemMutation();
  const [message, setMessage] = useState("");
  if (session.isLoading) return null;
  if (session.isError || !session.data?.user)
    return <Link href="/login">Sign in to save this item</Link>;
  return (
    <div className="section-stack">
      <Button
        variant="secondary"
        loading={state.isLoading}
        onClick={async () => {
          setMessage("");
          try {
            await save(id).unwrap();
            setMessage("Item saved. Find it in Saved items.");
          } catch (error) {
            setMessage(requestError(error));
          }
        }}
      >
        <Bookmark size={18} aria-hidden="true" />
        Save item
      </Button>
      {message && (
        <p role="status">
          {message} <Link href="/saved-items">View saved items</Link>
        </p>
      )}
    </div>
  );
}

export function SavedItems() {
  return (
    <section className="container page-stack">
      <header className="hero">
        <p className="eyebrow">Your shortlist</p>
        <h1>Saved items</h1>
        <p className="muted">Keep useful reports close while you look for your belongings.</p>
      </header>
      <SessionGate>{(user) => <SavedList key={user.id} userId={user.id} />}</SessionGate>
    </section>
  );
}
function SavedList({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const list = useSavedItemsQuery({ page, userId }, { pollingInterval: 300000 });
  const [remove, removing] = useUnsaveItemMutation();
  const [message, setMessage] = useState("");
  return (
    <div className="section-stack">
      {message && <p role="status">{message}</p>}
      {list.isFetching && <p role="status">Loading saved items…</p>}
      {list.isError ? (
        <LoadError retry={() => list.refetch()} />
      ) : (
        list.currentData && (
          <>
            {!list.currentData.content.length && (
              <p>
                No saved items here yet. <Link href="/items">Browse reports</Link>
              </p>
            )}
            <div className="responsive-grid">
              {list.currentData.content.map((saved) => (
                <div key={saved.id} className="section-stack">
                  <ItemCard item={saved.item} />
                  <Button
                    variant="secondary"
                    loading={removing.isLoading}
                    onClick={async () => {
                      setMessage("");
                      try {
                        await remove(saved.item.id).unwrap();
                        if (page > 0 && list.currentData?.content.length === 1) setPage(page - 1);
                        setMessage("Item removed from your saved list.");
                      } catch (error) {
                        setMessage(requestError(error));
                      }
                    }}
                  >
                    Remove {saved.item.name} from saved
                  </Button>
                </div>
              ))}
            </div>
          </>
        )
      )}
      <Pagination
        page={page}
        last={!list.currentData || list.currentData.last || list.isError}
        busy={list.isFetching || removing.isLoading}
        onChange={setPage}
      />
    </div>
  );
}
