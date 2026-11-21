import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState, Loading } from "@/components/ui";
import { admin } from "@/lib/api";
import { CATEGORIES, type Collection, type Design, type ImageRef } from "@/lib/types";
import { Field, ImageUploader, Msg, PageHead } from "./parts";
import { useAdminFetch } from "./useAdminFetch";

export default function DesignForm() {
  const { id } = useParams();
  const editing = !!id;
  const nav = useNavigate();
  const existing = useAdminFetch<Design>(editing ? `/designs/${id}` : null);
  const cols = useAdminFetch<Collection[]>("/collections");
  const [f, setF] = useState({ title: "", description: "", category: CATEGORIES[0], collection_id: "", featured: false, status: "draft" as "draft" | "published" });
  const [images, setImages] = useState<ImageRef[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = existing.data;
    if (d) { setF({ title: d.title, description: d.description, category: d.category, collection_id: d.collection_id || "", featured: d.featured, status: d.status }); setImages(d.images); }
  }, [existing.data]);

  const save = async (status: "draft" | "published", e?: FormEvent) => {
    e?.preventDefault(); setErr(null);
    if (!f.title.trim()) return setErr("Please add a title.");
    if (status === "published" && images.length === 0) return setErr("Add at least one photograph before publishing.");
    setBusy(true);
    const body = { ...f, status, collection_id: f.collection_id || null, images };
    try {
      if (editing) await admin.put(`/designs/${id}`, body); else await admin.post("/designs", body);
      nav("/admin/designs");
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  };

  if (editing && existing.loading) return <Loading />;
  if (editing && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  return (
    <form onSubmit={(e) => save(f.status, e)} className="max-w-3xl">
      <PageHead title={editing ? "Edit design" : "New design"} />
      {err && <Msg kind="error">{err}</Msg>}
      <div className="space-y-6">
        <Field label="Photographs"><ImageUploader images={images} onChange={setImages} /></Field>
        <Field label="Title"><input className="field" maxLength={140} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></Field>
        <Field label="Description"><textarea rows={5} className="field" maxLength={4000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Category"><select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Collection (optional)"><select className="field" value={f.collection_id} onChange={(e) => setF({ ...f, collection_id: e.target.value })}>
            <option value="">None</option>{cols.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        </div>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-brown" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Feature this design on the home page</label>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 border-t border-beige pt-6">
        <button type="button" className="btn btn-dark" disabled={busy} onClick={() => save("published")}>{busy ? "Saving..." : editing && f.status === "published" ? "Save & keep published" : "Publish"}</button>
        <button type="button" className="btn btn-line" disabled={busy} onClick={() => save("draft")}>Save as draft</button>
        <button type="button" className="btn" onClick={() => nav("/admin/designs")}>Cancel</button>
      </div>
    </form>
  );
}
