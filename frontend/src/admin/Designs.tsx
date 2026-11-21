import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Empty, ErrorState, Loading } from "@/components/ui";
import { admin } from "@/lib/api";
import { fmtDate, optimize } from "@/lib/media";
import type { Design } from "@/lib/types";
import { Badge, Msg, PageHead, StatusBadge } from "./parts";
import { useAdminFetch } from "./useAdminFetch";

export default function Designs() {
  const { data, error, loading, reload } = useAdminFetch<Design[]>("/designs");
  const [err, setErr] = useState<string | null>(null);
  const del = async (d: Design) => {
    if (!confirm(`Delete "${d.title}"? This cannot be undone.`)) return;
    try { await admin.del(`/designs/${d.id}`); reload(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <>
      <PageHead title="Designs"><Link to="/admin/designs/new" className="btn btn-dark !px-5 !py-3"><Plus className="h-4 w-4" /> New design</Link></PageHead>
      {err && <Msg kind="error">{err}</Msg>}
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? (
        <Empty title="No designs yet" hint="Upload your first photographs to get started." action={<Link to="/admin/designs/new" className="btn btn-dark">Add a design</Link>} />
      ) : (
        <ul className="divide-y divide-beige border border-beige">
          {data.map((d) => (
            <li key={d.id} className="flex items-center gap-3 p-3 sm:gap-4">
              {d.images[0] ? <img src={optimize(d.images[0].url, 160)} alt="" className="h-20 w-16 shrink-0 object-cover" /> : <div className="h-20 w-16 shrink-0 bg-cream" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.title}</p>
                <p className="truncate text-xs text-ink/60">{d.category} · {d.images.length} photo{d.images.length === 1 ? "" : "s"} · {fmtDate(d.created_at)}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5"><StatusBadge s={d.status} />{d.featured && <Badge tone="blue">featured</Badge>}{d.is_sample && <Badge tone="amber">sample</Badge>}</div>
              </div>
              <Link to={`/admin/designs/${d.id}`} aria-label={`Edit ${d.title}`} className="p-3 hover:bg-cream"><Pencil className="h-4 w-4" /></Link>
              <button onClick={() => del(d)} aria-label={`Delete ${d.title}`} className="p-3 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
