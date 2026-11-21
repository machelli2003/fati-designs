import { Instagram, Mail, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { whatsappLink } from "@/lib/media";

const LINKS = [["/", "Home"], ["/collections", "Collections"], ["/videos", "Videos"], ["/about", "About"], ["/contact", "Contact"]] as const;

function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const f = () => setSolid(window.scrollY > 30);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const cls = ({ isActive }: { isActive: boolean }) =>
    `text-[12px] uppercase tracking-[0.22em] transition hover:text-brown ${isActive ? "text-brown" : "text-ink"}`;
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${solid || open ? "bg-ivory/95 shadow-[0_1px_0_#D8C9B8] backdrop-blur" : "bg-transparent"}`}>
      <div className="container-x flex h-[72px] items-center justify-between">
        <Link to="/" className="max-w-[70vw] truncate whitespace-nowrap font-serif text-xl tracking-[0.12em] sm:max-w-none sm:text-2xl sm:tracking-[0.18em]">{settings.brand_name}</Link>
        <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
          {LINKS.map(([to, label]) => <NavLink key={to} to={to} end={to === "/"} className={cls}>{label}</NavLink>)}
        </nav>
        <button className="p-2 md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-x flex h-[calc(100svh-72px)] flex-col gap-2 overflow-y-auto overscroll-contain pt-8 pb-6 animate-fadeIn md:hidden" aria-label="Mobile">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className="border-b border-beige py-5 font-serif text-4xl">{label}</NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { settings: s } = useSettings();
  const wa = whatsappLink(s.whatsapp_number);
  return (
    <footer className="bg-ink text-ivory">
      <div className="container-x grid gap-12 py-16 md:grid-cols-3">
        <div>
          <p className="font-serif text-3xl tracking-[0.18em]">{s.brand_name}</p>
          <p className="mt-3 max-w-xs font-serif text-lg italic text-beige">{s.tagline}</p>
        </div>
        <div>
          <p className="eyebrow mb-4 !text-beige">Explore</p>
          <ul className="space-y-2 text-sm">
            {LINKS.map(([to, l]) => <li key={to}><Link to={to} className="text-ivory/80 hover:text-ivory">{l}</Link></li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 !text-beige">Get in touch</p>
          <ul className="space-y-2.5 text-sm text-ivory/80">
            {s.location && <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 translate-y-0.5" />{s.location}</li>}
            {s.email && <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 translate-y-0.5" /><a href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.phone && <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 translate-y-0.5" /><a href={`tel:${s.phone}`}>{s.phone}</a></li>}
          </ul>
          <div className="mt-5 flex gap-3">
            {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" className="border border-ivory/30 p-2.5 transition hover:bg-ivory hover:text-ink"><Instagram className="h-4 w-4" /></a>}
            {wa && <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="border border-ivory/30 p-2.5 transition hover:bg-ivory hover:text-ink"><MessageCircle className="h-4 w-4" /></a>}
          </div>
        </div>
      </div>
      <div className="border-t border-ivory/10 py-5 text-center text-[11px] tracking-widest text-ivory/50">
        © {new Date().getFullYear()} {s.brand_name}. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:bg-ink focus:p-3 focus:text-ivory">Skip to content</a>
      <Navbar />
      <main id="main"><Outlet /></main>
      <Footer />
    </>
  );
}
