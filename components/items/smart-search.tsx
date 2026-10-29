"use client";
import { useRef, useState, useEffect, type FormEvent } from "react";
import { useGetCategoriesQuery } from "@/store/api/items-api";
import type { PhotoSearchResults } from "@/lib/photo-search";
import { Button } from "@/components/ui/button";
import { ItemCard } from "./item-card";

export function SmartSearch() {
  const categories = useGetCategoriesQuery();
  const [results, setResults] = useState<PhotoSearchResults | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch("/api/catalog/search/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: form.get("query"),
          categoryId: form.get("categoryId"),
          ...(form.get("minScore") ? { minScore: Number(form.get("minScore")) } : {}),
        }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not complete search.");
      setResults(result.data);
    } catch (error) {
      if (!controller.signal.aborted)
        setError(error instanceof Error ? error.message : "Search unavailable.");
    } finally {
      if (pending.current === controller) {
        pending.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section className="container page-stack">
      <header className="hero">
        <p className="eyebrow">Search by meaning</p>
        <h1>Describe what you lost</h1>
        <p className="muted">
          Find open found reports using a natural description. Similarity helps you explore matches;
          it does not establish ownership.
        </p>
      </header>
      <form className="section-stack feature-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="smart-query">Item description</label>
          <textarea
            id="smart-query"
            name="query"
            className="ui-input"
            placeholder="A small blue backpack with a broken zip…"
            rows={4}
            required
            maxLength={2000}
          />
        </div>
        <div className="field">
          <label htmlFor="smart-category">Category</label>
          <select id="smart-category" name="categoryId" className="ui-input">
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {categories.isError && <LoadCategories retry={() => categories.refetch()} />}
        <div className="field">
          <label htmlFor="smart-score">Minimum similarity (optional, −1 to 1)</label>
          <input
            id="smart-score"
            name="minScore"
            className="ui-input"
            type="number"
            min={-1}
            max={1}
            step={0.01}
          />
        </div>
        <div className="row">
          <Button type="submit" loading={busy}>
            Find similar items
          </Button>
          {busy && (
            <Button
              variant="secondary"
              onClick={() => {
                pending.current?.abort();
                setBusy(false);
                setError("Search cancelled.");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
      {error && <p role="alert">{error}</p>}
      {results && (
        <section className="section-stack" aria-label="Search results">
          <h2>
            {results.matches.length
              ? `${results.matches.length} similar reports`
              : "No matching reports"}
          </h2>
          <div className="responsive-grid">
            {results.matches.map((m) => (
              <div className="section-stack" key={m.item.id}>
                <ItemCard item={m.item} />
                <p className="muted">Similarity: {m.score.toFixed(3)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
function LoadCategories({ retry }: { retry: () => void }) {
  return (
    <p>
      Categories unavailable.{" "}
      <Button variant="ghost" onClick={retry}>
        Retry
      </Button>
    </p>
  );
}
