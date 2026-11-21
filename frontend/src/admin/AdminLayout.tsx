import { ExternalLink, FolderOpen, Inbox, LayoutDashboard, LogOut, Menu, Settings, Shirt, Video, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loading } from "@/components/ui";

const NAV = [
  ["/admin", "Overview", LayoutDashboard, true], ["/admin/designs", "Designs", Shirt, false],
  ["/admin/collections", "Collections", FolderOpen, false], ["/admin/videos", "Videos", Video, false],
  ["/admin/inquiries", "Inquiries", Inbox, false], ["/admin/settings", "Settings", Settings, false],
] as const;

export default function AdminLayout() {
  const { email, checking, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  if (checking) return <Loading />;
  if (!email) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  const links = (
    <nav className="space-y-1" aria-label="Admin">
      {NAV.map(([to, label, Icon, end]) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm transition ${isActive ? "bg-ink text-ivory" : "hover:bg-cream"}`}>
          <Icon className="h-4 w-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );
  const foot = (
    <div className="space-y-1 border-t border-beige pt-4 text-sm">
      <Link to="/" target="_blank" className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream"><ExternalLink className="h-4 w-4" /> View website</Link>
      <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-cream"><LogOut className="h-4 w-4" /> Log out</button>
      <p className="truncate px-4 pt-2 text-xs text-ink/50">{email}</p>
    </div>
  );
  return (
    <div className="min-h-screen bg-white md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-beige bg-ivory p-5 md:flex">
        <div><p className="mb-8 px-4 font-serif text-xl tracking-[0.15em]">FATI <span className="block text-[10px] tracking-widest2 text-brown">STUDIO ADMIN</span></p>{links}</div>{foot}
      </aside>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-beige bg-ivory px-4 py-3 md:hidden">
        <p className="font-serif tracking-[0.15em]">FATI ADMIN</p>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="p-2">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="fixed inset-x-0 bottom-0 top-[53px] z-30 flex flex-col justify-between overflow-auto bg-ivory p-5 md:hidden">{links}{foot}</div>}
      <main className="min-w-0 flex-1 bg-white p-5 sm:p-8 lg:p-10"><Outlet /></main>
    </div>
  );
}
