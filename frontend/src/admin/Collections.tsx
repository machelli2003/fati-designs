import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Empty, ErrorState, Loading } from "@/components/ui";
import { admin } from "@/lib/api";
import { optimize } from "@/lib/media";
import type { Collection, Design } from "@/lib/types";
import { Badge, Field, Msg, PageHead, SingleUploader, StatusBadge } from "./parts";
import { useAdminFetch } from "./useAdminFetch";

const blank = { name: "", description: "", cover_url: null as string | null, cover_public_id: null as string | null, status: "published" as "draft" | "published" };

export default function Collections() {
  const list = useAdminFetch<Collection[]>("/collections");
  const designs = useAdminFetch<Design[]>("/designs");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState(blank);
  const [members, setMembers] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = (c?: Collection) => {
    setErr(null);
    setEditing(c ? c.id : "new");
    setF(c ? { name: c.name, description: c.description, cover_url: c.cover_url || null, cover_public_id: c.cover_public_id || null, status: c.status } : blank);
    setMembers(new Set((designs.data || []).filter((d) => c && d.collection_id === c.id).map((d) => d.id)));
  };
  useEffect(() => { if (editing === null) window.scrollTo(0, 0); }, [editing]);

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const saved = editing === "new" ? await admin.post<Collection>("/collections", f) : await admin.put<Collection>(`/collections/${editing}`, f);
      await admin.put(`/collections/${saved.id}/designs`, { design_ids: [...members] });
      setEditing(null); list.reload(); designs.reload();
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const del = async (c: Collection) => {
    if (!confirm(`Delete collection "${c.name}"? Its designs are kept but removed from the collection.`)) return;
    try { await admin.del(`/collections/${c.id}`); list.reload(); designs.reload(); } catch (x) { setErr((x as Error).message); }
  };
  const toggle = (id: string) => setMembers((m) => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (editing) return (
    <form onSubmit={save} className="max-w-3xl">
      <PageHead title={editing === "new" ? "New collection" : "Edit collection"} />
      {err && <Msg kind="error">{err}</Msg>}
      <div className="space-y-6">
        <Field label="Collection name"><input className="field" required maxLength={140} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={3} className="field" maxLength={2000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Cover image" hint="Optional. If empty, the first design's photo is used."><SingleUploader kind="image" folder="designs" label="cover" value={f.cover_url}
          onDone={(u) => setF({ ...f, cover_url: u.url, cover_public_id: u.public_id })} onClear={() => setF({ ...f, cover_url: null, cover_public_id: null })} /></Field>
        <Field label="Status"><select className="field" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as "draft" | "published" })}><option value="published">Published</option><option value="draft">Draft</option></select></Field>
        <Field label="Designs in this collection">
          {designs.loading ? <Loading /> : !designs.data?.length ? <p className="text-sm text-ink/60">No designs yet. Add designs first, then assign them here.</p> : (
            <ul className="max-h-80 divide-y divide-beige overflow-auto border border-beige">
              {designs.data.map((d) => (
                <li key={d.id}><label className="flex cursor-pointer items-center gap-3 p-2.5 hover:bg-cream">
                  <input type="checkbox" className="h-4 w-4 accent-brown" checked={members.has(d.id)} onChange={() => toggle(d.id)} />
                  {d.images[0] ? <img src={optimize(d.images[0].url, 100)} alt="" className="h-10 w-8 object-cover" /> : <div className="h-10 w-8 bg-cream" />}
                  <span className="truncate text-sm">{d.title}</span></label></li>
              ))}
            </ul>
          )}
        </Field>
      </div>
      <div className="mt-8 flex gap-3 border-t border-beige pt-6">
        <button className="btn btn-dark" disabled={busy}>{busy ? "Saving..." : "Save collection"}</button>
        <button type="button" className="btn" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </form>
  );

  return (
    <>
      <PageHead title="Collections"><button onClick={() => open()} className="btn btn-dark !px-5 !py-3"><Plus className="h-4 w-4" /> New collection</button></PageHead>
      {err && <Msg kind="error">{err}</Msg>}
      {list.loading ? <Loading /> : list.error ? <ErrorState message={list.error} onRetry={list.reload} /> : !list.data?.length ? (
        <Empty title="No collections yet" hint="Group related designs together, e.g. 'Bridal 2026'." />
      ) : (
        <ul className="divide-y divide-beige border border-beige">
          {list.data.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-3">
              {c.cover_url ? <img src={optimize(c.cover_url, 160)} alt="" className="h-16 w-14 object-cover" /> : <div className="h-16 w-14 bg-cream" />}
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{c.name}</p>
                <p className="text-xs text-ink/60">{c.design_count} design{c.design_count === 1 ? "" : "s"}</p>
                <div className="mt-1 flex gap-1.5"><StatusBadge s={c.status} />{c.is_sample && <Badge tone="amber">sample</Badge>}</div></div>
              <button onClick={() => open(c)} aria-label={`Edit ${c.name}`} className="p-3 hover:bg-cream"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => del(c)} aria-label={`Delete ${c.name}`} className="p-3 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
