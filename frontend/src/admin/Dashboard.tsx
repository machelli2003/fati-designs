import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { ErrorState, Loading } from "@/components/ui";
import { fmtDate, optimize } from "@/lib/media";
import { useAdminFetch } from "./useAdminFetch";
import { Badge, PageHead } from "./parts";
import type { Stats } from "@/lib/types";

export default function Dashboard() {
  const { data, error, loading, reload } = useAdminFetch<Stats>("/stats");
  if (loading) return <Loading />;
  if (error || !data) return <ErrorState message={error || "Failed to load"} onRetry={reload} />;
  const cards = [["Designs", data.designs, "/admin/designs"], ["Collections", data.collections, "/admin/collections"], ["Videos", data.videos, "/admin/videos"], ["Inquiries", data.inquiries, "/admin/inquiries"]] as const;
  return (
    <>
      <PageHead title="Overview" />
      {!data.storage_configured && (
        <div className="mb-6 flex gap-3 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Photo and video uploads are switched off because Cloudinary keys are missing on the backend. See the README, step "Media storage".</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(([l, n, to]) => (
          <Link key={l} to={to} className="border border-beige p-5 transition hover:border-ink">
            <p className="eyebrow">{l}</p><p className="mt-2 font-serif text-5xl">{n}</p>
            {l === "Inquiries" && data.new_inquiries > 0 && <Badge tone="amber">{data.new_inquiries} new</Badge>}
          </Link>
        ))}
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-2xl">Recent designs</h2>
          {data.recent_designs.length === 0 ? <p className="text-sm text-ink/60">No designs yet. <Link className="underline" to="/admin/designs/new">Add the first one</Link>.</p> :
            <ul className="divide-y divide-beige border border-beige">{data.recent_designs.map((d) => (
              <li key={d.id}><Link to={`/admin/designs/${d.id}`} className="flex items-center gap-3 p-3 hover:bg-cream">
                {d.images[0] ? <img src={optimize(d.images[0].url, 120)} alt="" className="h-14 w-11 object-cover" /> : <div className="h-14 w-11 bg-cream" />}
                <div className="min-w-0 flex-1"><p className="truncate">{d.title}</p><p className="text-xs text-ink/50">{fmtDate(d.created_at)}</p></div>
                <Badge tone={d.status === "published" ? "green" : "gray"}>{d.status}</Badge></Link></li>))}</ul>}
        </section>
        <section>
          <h2 className="mb-4 text-2xl">Recent inquiries</h2>
          {data.recent_inquiries.length === 0 ? <p className="text-sm text-ink/60">No inquiries yet.</p> :
            <ul className="divide-y divide-beige border border-beige">{data.recent_inquiries.map((i) => (
              <li key={i.id}><Link to="/admin/inquiries" className="block p-3 hover:bg-cream">
                <div className="flex justify-between gap-2"><p className="truncate font-medium">{i.name}</p><Badge tone={i.status === "new" ? "amber" : i.status === "contacted" ? "blue" : "green"}>{i.status}</Badge></div>
                <p className="truncate text-sm text-ink/60">{i.message}</p></Link></li>))}</ul>}
        </section>
      </div>
    </>
  );
}
