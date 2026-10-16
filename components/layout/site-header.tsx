import Image from "next/image";
import Link from "next/link";
import { Palette } from "lucide-react";
import { APP, ROUTES } from "@/lib/constants";

export function SiteHeader() {
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href={ROUTES.home}><Image src={APP.logo} alt="" width={40} height={40} /><span>{APP.name}</span></Link>
    <nav aria-label="Main navigation" className="row"><Link className="nav-link" href={ROUTES.items}>Browse items</Link><Link className="nav-link" href={ROUTES.designSystem}><Palette size={18} aria-hidden="true" />UI foundations</Link></nav>
  </div>

  </header>;
}
