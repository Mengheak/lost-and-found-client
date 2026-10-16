"use client";

import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ITEM_TYPES, ITEM_TYPE_LABELS } from "@/lib/constants";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { resetFilters, setQuery, setType } from "@/store/slices/filters-slice";

export function FilterDemo() {
  const dispatch = useAppDispatch();
  const { query, type } = useAppSelector((state) => state.filters);
  return <div className="section-stack">
    <div className="row"><Search size={20} aria-hidden="true" /><h2>Search controls</h2></div>
    <Input label="Search items" placeholder="Try keys, a bag, or a phone" value={query} onChange={(event) => dispatch(setQuery(event.target.value))} hint="Component preview — no live item data is connected." />
    <div className="row" role="group" aria-label="Item type">{ITEM_TYPES.map((value) => <Button key={value} variant={value === type ? "primary" : "secondary"} aria-pressed={value === type} onClick={() => dispatch(setType(value))}>{ITEM_TYPE_LABELS[value]}</Button>)}</div>
    <p className="muted" role="status">{ITEM_TYPE_LABELS[type]}{query.trim() && ` matching “${query.trim()}”`}</p>
    <div><Button variant="ghost" onClick={() => dispatch(resetFilters())} disabled={!query && type === "all"}><RotateCcw size={16} aria-hidden="true" />Reset filters</Button></div>
  </div>;
}
