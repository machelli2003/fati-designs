import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Empty, ErrorState, Loading } from "@/components/ui";
import { admin } from "@/lib/api";
import { fmtDate, optimize, parseEmbed, videoThumb } from "@/lib/media";
import type { Video } from "@/lib/types";
import { Field, Msg, PageHead, SingleUploader, StatusBadge } from "./parts";
import { useAdminFetch } from "./useAdminFetch";

export function VideosList() {
  const { data, error, loading, reload } = useAdminFetch<Video[]>("/videos");
  const [err, setErr] = useState<string | null>(null);
  const del = async (v: Video) => {
    if (!confirm(`Delete "${v.title}"?`)) return;
    try { await admin.del(`/videos/${v.id}`); reload(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <>
      <PageHead title="Videos"><Link to="/admin/videos/new" className="btn btn-dark !px-5 !py-3"><Plus className="h-4 w-4" /> New video</Link></PageHead>
      {err && <Msg kind="error">{err}</Msg>}
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <Empty title="No videos yet" hint="Upload an MP4 or paste a YouTube/Vimeo link." /> : (
        <ul className="divide-y divide-beige border border-beige">
          {data.map((v) => {
            const t = videoThumb(v);
            return (
              <li key={v.id} className="flex items-center gap-3 p-3 sm:gap-4">
                {t ? <img src={optimize(t, 240)} alt="" className="h-16 w-28 shrink-0 object-cover" /> : <div className="h-16 w-28 shrink-0 bg-cream" />}
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{v.title}</p>
                  <p className="text-xs text-ink/60">{v.category === "runway" ? "Runway" : "Creative process"} · {v.source === "upload" ? "MP4" : "Link"} · {fmtDate(v.created_at)}</p>
                  <div className="mt-1 flex gap-1.5"><StatusBadge s={v.status} /></div></div>
                <Link to={`/admin/videos/${v.id}`} aria-label={`Edit ${v.title}`} className="p-3 hover:bg-cream"><Pencil className="h-4 w-4" /></Link>
                <button onClick={() => del(v)} aria-label={`Delete ${v.title}`} className="p-3 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

type Form = { title: string; description: string; category: "runway" | "process"; source: "upload" | "embed"; video_url: string; video_public_id: string | null; thumbnail_url: string | null; thumbnail_public_id: string | null };
const blank: Form = { title: "", description: "", category: "runway", source: "upload", video_url: "", video_public_id: null, thumbnail_url: null, thumbnail_public_id: null };

export function VideoForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const existing = useAdminFetch<Video>(id ? `/videos/${id}` : null);
  const [f, setF] = useState<Form>(blank);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const v = existing.data;
    if (v) setF({ title: v.title, description: v.description, category: v.category, source: v.source, video_url: v.video_url, video_public_id: v.video_public_id || null, thumbnail_url: v.thumbnail_url || null, thumbnail_public_id: v.thumbnail_public_id || null });
  }, [existing.data]);

  const save = async (status: "draft" | "published", e?: FormEvent) => {
    e?.preventDefault(); setErr(null);
    if (!f.title.trim()) return setErr("Please add a title.");
    if (!f.video_url.trim()) return setErr(f.source === "upload" ? "Upload a video file first." : "Paste a YouTube or Vimeo link.");
    if (f.source === "embed" && !parseEmbed(f.video_url)) return setErr("That doesn't look like a valid YouTube or Vimeo link.");
    setBusy(true);
    try {
      const body = { ...f, status };
      if (id) await admin.put(`/videos/${id}`, body); else await admin.post("/videos", body);
      nav("/admin/videos");
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  };
  if (id && existing.loading) return <Loading />;
  if (id && existing.error) return <ErrorState message={existing.error} onRetry={existing.reload} />;
  return (
    <form onSubmit={(e) => save(existing.data?.status || "draft", e)} className="max-w-3xl">
      <PageHead title={id ? "Edit video" : "New video"} />
      {err && <Msg kind="error">{err}</Msg>}
      <div className="space-y-6">
        <Field label="Title"><input className="field" required maxLength={140} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={3} className="field" maxLength={3000} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Category"><select className="field" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Form["category"] })}>
          <option value="runway">Fati on the Runway</option><option value="process">The Creative Process</option></select></Field>
        <Field label="Video source">
          <div className="mb-3 flex gap-2">{(["upload", "embed"] as const).map((s) => (
            <button type="button" key={s} onClick={() => setF({ ...f, source: s, video_url: "", video_public_id: null })}
              className={`border px-4 py-2 text-xs uppercase tracking-wider ${f.source === s ? "border-ink bg-ink text-ivory" : "border-beige"}`}>{s === "upload" ? "Upload MP4" : "YouTube / Vimeo link"}</button>))}</div>
          {f.source === "upload"
            ? <SingleUploader kind="video" folder="videos" label="video" value={f.video_url || null} onDone={(u) => setF({ ...f, video_url: u.url, video_public_id: u.public_id })} onClear={() => setF({ ...f, video_url: "", video_public_id: null })} />
            : <input className="field" placeholder="https://www.youtube.com/watch?v=..." value={f.video_url} onChange={(e) => setF({ ...f, video_url: e.target.value })} />}
          {f.source === "upload" && <p className="mt-2 text-xs text-ink/50">MP4 up to 100MB. For longer videos, upload to YouTube and use the link option.</p>}
        </Field>
        <Field label="Thumbnail" hint="Optional. If empty, one is made automatically from the video.">
          <SingleUploader kind="image" folder="thumbnails" label="thumbnail" value={f.thumbnail_url} onDone={(u) => setF({ ...f, thumbnail_url: u.url, thumbnail_public_id: u.public_id })} onClear={() => setF({ ...f, thumbnail_url: null, thumbnail_public_id: null })} />
        </Field>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 border-t border-beige pt-6">
        <button type="button" className="btn btn-dark" disabled={busy} onClick={() => save("published")}>{busy ? "Saving..." : "Publish"}</button>
        <button type="button" className="btn btn-line" disabled={busy} onClick={() => save("draft")}>Save as draft</button>
        <button type="button" className="btn" onClick={() => nav("/admin/videos")}>Cancel</button>
      </div>
    </form>
  );
}
