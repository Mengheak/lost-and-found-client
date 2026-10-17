import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { APP, ROUTES } from "@/lib/constants";
import { AuthNavigation } from "@/components/auth/auth-navigation";

export function SiteHeader() {
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href={ROUTES.home}><Image src={APP.logo} alt="" width={40} height={40} /><span>{APP.name}</span></Link>
    <nav aria-label="Main navigation" className="row"><Link className="nav-link" href={ROUTES.items}><Search size={18} aria-hidden="true" />Browse items</Link><AuthNavigation /></nav>
  </div>

  </header>;
}
