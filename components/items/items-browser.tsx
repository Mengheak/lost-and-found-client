"use client";

import { useState, type FormEvent } from "react";
import { Search, RotateCcw, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useGetCategoriesQuery, useGetItemsQuery } from "@/store/api/items-api";
import { resetFilters, setCategory, setPage, setQuery, setStatus, setType } from "@/store/slices/filters-slice";
import { ITEM_TYPES, ITEM_TYPE_LABELS } from "@/lib/constants";
import { STATUS_LABELS, type ItemStatus } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItemCard } from "./item-card";

export function ItemsBrowser() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters);
  const [query, setDraftQuery] = useState(filters.query);
  const { currentData: data, isFetching, isError, refetch } = useGetItemsQuery(filters, { pollingInterval: 300000 });
  const categories = useGetCategoriesQuery();
  const filtered = !!(filters.query || filters.categoryId || filters.status || filters.type !== "all");
  function reset() { setDraftQuery(""); dispatch(resetFilters()); }
  function search(event: FormEvent) { event.preventDefault(); dispatch(setQuery(query)); }

  return <div className="container page-stack">
    <header className="hero"><p className="eyebrow">Lost & Found / Community board</p><h1>A little searching.<br />A happy reunion.</h1><p className="muted">Browse lost belongings and found treasures. Your next match could be right here.</p></header>
    <section className="browse-controls" aria-label="Search and filter items">
      <form onSubmit={search} className="search-form"><Input label="Search items" placeholder="What are you looking for?" value={query} onChange={(e) => setDraftQuery(e.target.value)} maxLength={200} /><Button type="submit"><Search size={18} aria-hidden="true" />Search</Button></form>
      <div className="filter-row">
        <div className="row" role="group" aria-label="Item type">{ITEM_TYPES.map((type) => <Button key={type} variant={filters.type === type ? "primary" : "secondary"} aria-pressed={filters.type === type} onClick={() => dispatch(setType(type))}>{ITEM_TYPE_LABELS[type]}</Button>)}</div>
        <div className="field"><label htmlFor="category">Category</label><select id="category" className="ui-input" value={filters.categoryId} disabled={!categories.data} onChange={(e) => dispatch(setCategory(e.target.value))}><option value="">All categories</option>{categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
        <div className="field"><label htmlFor="status">Status</label><select id="status" className="ui-input" value={filters.status} onChange={(e) => dispatch(setStatus(e.target.value as "" | ItemStatus))}><option value="">All statuses</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <Button variant="ghost" onClick={reset} disabled={!filtered && !query}><RotateCcw size={16} aria-hidden="true" />Reset</Button>
      </div>
      {categories.isError && <div role="alert" className="row"><p>Categories could not be loaded.</p><Button variant="secondary" size="sm" onClick={() => categories.refetch()}>Retry categories</Button></div>}
    </section>
    <section className="section-stack" aria-label="Item results" aria-busy={isFetching}>
      <div className="results-heading"><h2>{filtered ? "Matching items" : "Latest items"}</h2><p className="muted" role="status">{isFetching ? "Loading items…" : isError ? "Items unavailable" : `${data?.totalElements ?? 0} items`}</p></div>
      {isError ? <div className="browse-message" role="alert"><h2>We couldn’t load the items</h2><p className="muted">The connection may be interrupted. Please try again.</p><Button onClick={() => refetch()}>Try again</Button></div>
        : !data ? <div className="responsive-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div className="item-skeleton" key={i} />)}</div>
        : data.content.length === 0 ? <div className="browse-message"><PackageSearch size={40} aria-hidden="true" /><h2>{filtered ? "No matching items yet" : "No items posted yet"}</h2><p className="muted">{filtered ? "Try another keyword or clear your filters." : "New lost and found reports will appear here."}</p>{filtered && <Button variant="secondary" onClick={reset}>Clear filters</Button>}{filters.page > 0 && <Button onClick={() => dispatch(setPage(0))}>Back to first page</Button>}</div>
        : <div className="responsive-grid">{data.content.map((item) => <ItemCard key={item.id} item={item} />)}</div>}
      {!isError && data && data.totalPages > 1 && <nav className="pagination" aria-label="Results pages"><Button variant="secondary" disabled={data.first || isFetching} onClick={() => dispatch(setPage(filters.page - 1))}><ChevronLeft size={18} aria-hidden="true" />Previous</Button><span>Page {data.page + 1} of {data.totalPages}</span><Button variant="secondary" disabled={data.last || isFetching} onClick={() => dispatch(setPage(filters.page + 1))}>Next<ChevronRight size={18} aria-hidden="true" /></Button></nav>}
    </section>
  </div>;
}
