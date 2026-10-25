"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ScanLine, Upload, PackageSearch, X } from "lucide-react";
import { useGetCategoriesQuery } from "@/store/api/items-api";
import { photoSearchError, validateSearchPhoto, type PhotoSearchResults } from "@/lib/photo-search";
import { Button } from "@/components/ui/button";
import { ItemCard } from "./item-card";
import styles from "./photo-search.module.css";

export function PhotoSearch({ onClose }: { onClose: () => void }) {
  const categories = useGetCategoriesQuery();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<PhotoSearchResults | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const active = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => () => active.current?.abort(), []);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function clearSearch() {
    active.current?.abort();
    active.current = null;
    setLoading(false);
    setResults(null);
    setError("");
  }

  function selectPhoto(files: File[]) {
    if (!files.length) return;
    clearSearch();
    const message = validateSearchPhoto(files);
    if (message) {
      setError(message);
      return;
    }
    setFile(files[0]);
    setPreview(URL.createObjectURL(files[0]));
  }

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    clearSearch();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    const body = new FormData();
    body.set("file", file);
    if (category) body.set("categoryId", category);
    try {
      const response = await fetch("/api/catalog/search/photo", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !result.success || !Array.isArray(result.data?.matches)) {
        setError(photoSearchError(response.status));
        return;
      }
      setResults(result.data);
    } catch {
      if (!controller.signal.aborted) setError(photoSearchError(503));
    } finally {
      if (active.current === controller) {
        active.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="photo-search-title"
      aria-describedby="photo-search-description"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className={styles.header}>
        <span className={styles.mark}>
          <ScanLine size={24} aria-hidden="true" />
        </span>
        <div>
          <h2 id="photo-search-title">Search by image</h2>
          <p id="photo-search-description" className="muted">
            A photo can help you find what you’ve lost.
          </p>
        </div>
        <Button variant="ghost" iconLabel="Close image search" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </Button>
      </div>
      <div className={styles.layout}>
        <form onSubmit={search} className={styles.controls} aria-label="Search by photo">
          <div className="field">
            <input
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose an item photo"
              id="search-photo"
              ref={picker}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="search-photo-help"
              onChange={(event) => {
                selectPhoto(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
            {!file && (
              <button
                type="button"
                className={styles.upload}
                autoFocus
                onClick={() => picker.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  selectPhoto(Array.from(event.dataTransfer.files));
                }}
              >
                <span className={styles.uploadIcon}>
                  <Upload size={26} aria-hidden="true" />
                </span>
                <strong>Drop an item photo here</strong>
                <span className="muted">
                  or <span className={styles.browse}>choose a photo</span>
                </span>
              </button>
            )}
            <p id="search-photo-help" className="muted">
              JPG, PNG or WebP · Up to 5 MB
            </p>
          </div>
          {file && (
            <div className={styles.preview}>
              {preview && (
                <Image
                  src={preview}
                  alt="Photo selected for search"
                  width={240}
                  height={180}
                  unoptimized
                />
              )}
              <span>{file.name}</span>
              <div className="row">
                <Button variant="secondary" size="sm" onClick={() => picker.current?.click()}>
                  Change photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearSearch();
                    setFile(null);
                    setPreview("");
                    if (picker.current) picker.current.value = "";
                  }}
                >
                  <X size={16} aria-hidden="true" />
                  Remove photo
                </Button>
              </div>
            </div>
          )}
          <div className="field">
            <label htmlFor="photo-category">
              Category <span className="muted">(optional)</span>
            </label>
            <select
              id="photo-category"
              className="ui-input"
              value={category}
              disabled={!categories.data}
              onChange={(event) => {
                clearSearch();
                setCategory(event.target.value);
              }}
            >
              <option value="">All categories</option>
              {categories.data?.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>
          {categories.isError && (
            <div role="alert">
              <p>Categories unavailable. You can still search all categories.</p>
              <Button variant="ghost" size="sm" onClick={() => categories.refetch()}>
                Retry categories
              </Button>
            </div>
          )}
          <Button type="submit" disabled={!file} loading={loading}>
            <ScanLine size={18} aria-hidden="true" />
            {loading ? "Finding similar items…" : "Find similar items"}
          </Button>
          {loading && (
            <Button variant="ghost" onClick={clearSearch}>
              Cancel search
            </Button>
          )}
          {error && <p role="alert">{error}</p>}
          <p className={styles.note}>
            Searches open found reports, with the closest visual matches first.
          </p>
        </form>
        {(loading || results) && (
          <section
            className="section-stack browse-results"
            aria-label="Photo search results"
            aria-busy={loading}
          >
            <div className="results-heading">
              <h2>Similar found items</h2>
              <p className="muted" role="status">
                {loading
                  ? "Looking for similar photos…"
                  : results
                    ? `${results.matches.length} matches`
                    : "Choose a photo to get started"}
              </p>
            </div>
            {results &&
              (results.matches.length ? (
                <>
                  <p className="muted">
                    Up to 20 visually similar reports. Check the details to see if an item is yours.
                  </p>
                  <div className="post-feed">
                    {results.matches.map(({ item }) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="browse-message">
                  <PackageSearch size={40} aria-hidden="true" />
                  <h2>No similar items found</h2>
                  <p className="muted">
                    Try a clearer photo or search all categories. Newly indexed found reports may
                    appear later.
                  </p>
                </div>
              ))}
          </section>
        )}
      </div>
    </dialog>
  );
}
