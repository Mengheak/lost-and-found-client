import Link from "next/link";
import { ArrowRight, Search, HandHeart, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { APP, ROUTES } from "@/lib/constants";

export default function Home() {
  return <div className="container page-stack">
    <section className="hero">
      <p className="eyebrow">A little help. A happy reunion.</p>
      <h1>Lost something?<br />Let’s find it together.</h1>
      <p className="muted">{APP.description} A shared space for the things we lose and the people who help us find them.</p>
      <div className="row"><Link className="ui-button ui-button--primary no-underline" href={ROUTES.designSystem}>Explore UI foundations <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </section>
    <section aria-label="How it works" className="responsive-grid">
      {[{ icon: Search, title: "Describe what’s missing", text: "The details make all the difference." }, { icon: MapPin, title: "Find a local match", text: "Connect belongings with the places they were last seen." }, { icon: HandHeart, title: "Bring it back home", text: "A small act of kindness can make someone’s day." }].map(({ icon: Icon, title, text }) => <Card key={title} className="section-stack"><Icon size={28} aria-hidden="true" /><h2>{title}</h2><p className="muted">{text}</p></Card>)}
    </section>
  </div>;
}
