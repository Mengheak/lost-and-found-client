import type { Metadata } from "next";
import { Check, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterDemo } from "@/components/design-system/filter-demo";

export const metadata: Metadata = { title: "UI foundations" };

export default function DesignSystemPage() {
  return <div className="container page-stack">
    <header className="hero"><p className="eyebrow">Lost & Found / Design system</p><h1>Made to feel familiar.</h1><p className="muted">Shared colors, type, and components for a consistent experience on every screen.</p></header>
    <section className="section-stack" aria-labelledby="colors"><h2 id="colors">Colors</h2><div className="responsive-grid">{[{ name: "Primary", variable: "--primary" }, { name: "Ink", variable: "--ink" }, { name: "Surface", variable: "--surface-alt" }].map(({ name, variable }) => <Card key={name}><div className="swatch" style={{ background: `var(${variable})` }} /><h3>{name}</h3><code className="muted">{variable}</code></Card>)}</div></section>
    <Card><FilterDemo /></Card>
    <div className="responsive-grid">
      <Card className="section-stack"><h2>Buttons</h2><p className="muted">Visual examples of shared action styles.</p><div className="row"><Button><Search size={18} aria-hidden="true" />Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="danger">Danger</Button><Button disabled>Disabled</Button><Button loading>Loading</Button></div></Card>
      <Card className="section-stack"><h2>Item labels</h2><div className="row"><Badge tone="lost">Lost</Badge><Badge tone="found"><Check size={14} aria-hidden="true" />Found</Badge><Badge>Pending</Badge></div><p className="muted">Text and color communicate each state together.</p></Card>
      <Card className="section-stack"><h2>Form fields</h2><Input label="Item name" placeholder="Black backpack" hint="Keep the description short and clear." /><Input label="Location" defaultValue="" error="Please enter a location." /><Input label="Reference number" value="Assigned after submission" disabled /></Card>
    </div>
  </div>;
}
