"use client";

import { useState, type FormEvent } from "react";
import {
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  SlidersHorizontal,
  ChevronDown,
  ScanLine,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetCategoriesQuery, useGetItemsQuery } from "@/store/api/items-api";
import {
  resetFilters,
  setCategory,
  setPage,
  setQuery,
  setStatus,
  setType,
} from "@/store/slices/filters-slice";
import { ITEM_TYPES, ITEM_TYPE_LABELS } from "@/lib/constants";
import { STATUS_LABELS, type ItemStatus } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { ItemCard } from "./item-card";
import { PhotoSearch } from "./photo-search";

export function ItemsBrowser({ sidebar = false }: { sidebar?: boolean }) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const [query, setDraftQuery] = useState(filters.query);
  const [photoSearchOpen, setPhotoSearchOpen] = useState(false);
  const {
    currentData: data,
    isFetching,
    isError,
    refetch,
  } = useGetItemsQuery(filters, { pollingInterval: 300000 });
  const categories = useGetCategoriesQuery();
  const filtered = !!(
    filters.query ||
    filters.categoryId ||
    filters.status ||
    filters.type !== "all"
  );
  function reset() {
    setDraftQuery("");
    dispatch(resetFilters());
  }
  function search(event: FormEvent) {
    event.preventDefault();
    dispatch(setQuery(query));
  }

  return (
    <div className={`container page-stack ${sidebar ? "items-page" : "home-browser"} board-shell`}>
      {sidebar ? null : (
        <header className="hero">
          <p className="eyebrow">Lost & Found / Community board</p>
          <h1>Community posts</h1>
          <p className="muted">Something lost. Something found. Help someone bring it home.</p>
        </header>
      )}

      {photoSearchOpen && <PhotoSearch onClose={() => setPhotoSearchOpen(false)} />}
      <div className={`browse-layout${sidebar ? " browse-layout--sidebar" : ""}`}>
        {sidebar ? (
          <section
            className="browse-controls compact-controls"
            aria-label="Search and filter items"
          >
            <form onSubmit={search} className="compact-search">
              <label htmlFor="item-search" className="sr-only">
                Search items
              </label>
              <input
                id="item-search"
                type="search"
                placeholder="Search lost & found…"
                value={query}
                onChange={(e) => setDraftQuery(e.target.value)}
                maxLength={200}
              />
              <Button
                variant="ghost"
                iconLabel="Search by image"
                aria-haspopup="dialog"
                onClick={() => setPhotoSearchOpen(true)}
              >
                <ScanLine size={20} aria-hidden="true" />
              </Button>
              <Button type="submit" variant="ghost" iconLabel="Search items">
                <Search size={19} aria-hidden="true" />
              </Button>
            </form>

            <div className="item-type-tabs" role="group" aria-label="Item type">
              {ITEM_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={filters.type === type}
                  onClick={() => dispatch(setType(type))}
                >
                  {type === "all" ? "All items" : type === "lost" ? "Lost" : "Found"}
                </button>
              ))}
            </div>
            <details className="extra-filters">
              <summary>
                <SlidersHorizontal size={16} aria-hidden="true" />
                <span>
                  Filters
                  {(filters.categoryId || filters.status) &&
                    ` (${Number(!!filters.categoryId) + Number(!!filters.status)})`}
                </span>
                <ChevronDown className="filter-chevron" size={16} aria-hidden="true" />
              </summary>
              <div className="extra-filter-fields">
                <div className="field">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    className="ui-input"
                    value={filters.categoryId}
                    disabled={!categories.data}
                    onChange={(e) => dispatch(setCategory(e.target.value))}
                  >
                    <option value="">All categories</option>
                    {categories.data?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    className="ui-input"
                    value={filters.status}
                    onChange={(e) => dispatch(setStatus(e.target.value as "" | ItemStatus))}
                  >
                    <option value="">All statuses</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {categories.isError && (
                  <div role="alert" className="filter-error">
                    <p className="muted">Categories unavailable.</p>
                    <Button variant="ghost" size="sm" onClick={() => categories.refetch()}>
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </details>
            {(filtered || query) && (
              <Button className="clear-filters" variant="ghost" size="sm" onClick={reset}>
                <RotateCcw size={14} aria-hidden="true" />
                Clear all
              </Button>
            )}
          </section>
        ) : (
          <section className="browse-controls" aria-label="Search and filter items">
            <form onSubmit={search} className="search-form">
              <div className="field">
                <label htmlFor="home-item-search">Search items</label>
                <div className="compact-search">
                  <input
                    id="home-item-search"
                    type="search"
                    placeholder="What are you looking for?"
                    value={query}
                    onChange={(e) => setDraftQuery(e.target.value)}
                    maxLength={200}
                  />
                  <Button
                    variant="ghost"
                    iconLabel="Search by image"
                    aria-haspopup="dialog"
                    onClick={() => setPhotoSearchOpen(true)}
                  >
                    <ScanLine size={20} aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <Button type="submit">
                <Search size={18} aria-hidden="true" />
                Search
              </Button>
            </form>
            <div className="filter-row">
              <div className="row" role="group" aria-label="Item type">
                {ITEM_TYPES.map((type) => (
                  <Button
                    key={type}
                    variant={filters.type === type ? "primary" : "secondary"}
                    aria-pressed={filters.type === type}
                    onClick={() => dispatch(setType(type))}
                  >
                    {ITEM_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
              <div className="field">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  className="ui-input"
                  value={filters.categoryId}
                  disabled={!categories.data}
                  onChange={(e) => dispatch(setCategory(e.target.value))}
                >
                  <option value="">All categories</option>
                  {categories.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="ui-input"
                  value={filters.status}
                  onChange={(e) => dispatch(setStatus(e.target.value as "" | ItemStatus))}
                >
                  <option value="">All statuses</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <Button variant="ghost" onClick={reset} disabled={!filtered && !query}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset
              </Button>
            </div>
            {categories.isError && (
              <div role="alert" className="row">
                <p>Categories could not be loaded.</p>
                <Button variant="secondary" size="sm" onClick={() => categories.refetch()}>
                  <RotateCcw size={18} aria-hidden="true" />
                  Retry categories
                </Button>
              </div>
            )}
          </section>
        )}

        <section
          className="section-stack browse-results"
          aria-label="Item results"
          aria-busy={isFetching}
        >
          <div className="results-heading">
            <h2>{filtered ? "Matching posts" : "Latest posts"}</h2>
            <p className="muted" role="status">
              {isFetching
                ? "Loading items…"
                : isError
                  ? "Items unavailable"
                  : `${data?.totalElements ?? 0} items`}
            </p>
          </div>
          {isError ? (
            <div className="browse-message" role="alert">
              <h2>We couldn’t load the items</h2>
              <p className="muted">The connection may be interrupted. Please try again.</p>
              <Button onClick={() => refetch()}>
                <RotateCcw size={18} aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : !data ? (
            <div className="post-feed" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="item-skeleton" key={i} />
              ))}
            </div>
          ) : data.content.length === 0 ? (
            <div className="browse-message">
              <PackageSearch size={40} aria-hidden="true" />
              <h2>{filtered ? "No matching items yet" : "No items posted yet"}</h2>
              <p className="muted">
                {filtered
                  ? "Try another keyword or clear your filters."
                  : "New lost and found reports will appear here."}
              </p>
              {filtered && (
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw size={18} aria-hidden="true" />
                  Clear filters
                </Button>
              )}
              {filters.page > 0 && (
                <Button onClick={() => dispatch(setPage(0))}>
                  <ChevronLeft size={18} aria-hidden="true" />
                  Back to first page
                </Button>
              )}
            </div>
          ) : (
            <div className="post-feed">
              {data.content.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
          {!isError && data && data.totalPages > 1 && (
            <nav className="pagination" aria-label="Results pages">
              <Button
                variant="secondary"
                disabled={data.first || isFetching}
                onClick={() => dispatch(setPage(filters.page - 1))}
              >
                <ChevronLeft size={18} aria-hidden="true" />
                Previous
              </Button>
              <span>
                Page {data.page + 1} of {data.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={data.last || isFetching}
                onClick={() => dispatch(setPage(filters.page + 1))}
              >
                Next
                <ChevronRight size={18} aria-hidden="true" />
              </Button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
