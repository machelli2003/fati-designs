import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { optimize } from "@/lib/media";
import { uploadFile, VIDEO_TYPES, IMAGE_TYPES, type Uploaded } from "@/lib/upload";
import type { ImageRef } from "@/lib/types";

export const PageHead = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-4xl">{title}</h1><div className="flex gap-2">{children}</div>
  </div>
);
export const Badge = ({ tone, children }: { tone: "green" | "gray" | "amber" | "blue"; children: ReactNode }) => {
  const c = { green: "bg-emerald-100 text-emerald-800", gray: "bg-neutral-200 text-neutral-700", amber: "bg-amber-100 text-amber-800", blue: "bg-sky-100 text-sky-800" }[tone];
  return <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${c}`}>{children}</span>;
};
export const StatusBadge = ({ s }: { s: string }) => <Badge tone={s === "published" ? "green" : "gray"}>{s}</Badge>;
export const Msg = ({ kind, children }: { kind: "error" | "ok"; children: ReactNode }) => (
  <p role={kind === "error" ? "alert" : "status"} className={`mb-4 border px-4 py-3 text-sm ${kind === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{children}</p>
);
export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}</div>
);

interface Pending { name: string; pct: number }

/** Multi-photo uploader: progress, errors, reorder, choose cover (first image), remove. */
export function ImageUploader({ images, onChange }: { images: ImageRef[]; onChange: (i: ImageRef[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  // Keep latest images in a ref so concurrent uploads don't overwrite each other.
  const latest = useRef(images); latest.current = images;

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setErrors([]);
    const list = Array.from(files);
    setPending(list.map((f) => ({ name: f.name, pct: 0 })));
    const errs: string[] = [];
    await Promise.all(list.map(async (file, idx) => {
      try {
        const r = await uploadFile(file, "image", "designs", (pct) => setPending((p) => p.map((x, i) => (i === idx ? { ...x, pct } : x))));
        latest.current = [...latest.current, { url: r.url, public_id: r.public_id }];
        onChange(latest.current);
      } catch (e) { errs.push((e as Error).message); }
      setPending((p) => p.map((x, i) => (i === idx ? { ...x, pct: -1 } : x)));
    }));
    setErrors(errs); setPending([]);
    if (input.current) input.current.value = "";
  };
  const move = (i: number, d: number) => { const a = [...images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  const cover = (i: number) => { const a = [...images]; const [x] = a.splice(i, 1); onChange([x, ...a]); };
  const remove = (i: number) => onChange(images.filter((_, k) => k !== i));
  const uploading = pending.some((p) => p.pct >= 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div key={img.url + i} className="relative border border-beige bg-white">
            <img src={optimize(img.url, 400)} alt="" className="aspect-[3/4] w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 bg-ink px-2 py-0.5 text-[9px] uppercase tracking-wider text-ivory">Cover</span>}
            <div className="flex items-center justify-between border-t border-beige p-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="p-2 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => cover(i)} disabled={i === 0} aria-label="Make cover" title="Make cover" className="p-2 disabled:opacity-30"><Star className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} aria-label="Move later" className="p-2 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => remove(i)} aria-label="Remove photo" className="p-2 text-red-700"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => input.current?.click()} disabled={uploading}
          className="flex aspect-[3/4] flex-col items-center justify-center gap-2 border border-dashed border-brown/50 text-brown transition hover:bg-cream disabled:opacity-50">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-xs uppercase tracking-wider">{uploading ? "Uploading" : "Add photos"}</span>
        </button>
      </div>
      <input ref={input} type="file" multiple accept={IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => pick(e.target.files)} />
      {pending.filter((p) => p.pct >= 0).map((p) => (
        <div key={p.name} className="mt-3 text-xs"><div className="mb-1 flex justify-between"><span className="truncate">{p.name}</span><span>{p.pct}%</span></div>
          <div className="h-1.5 bg-beige"><div className="h-full bg-brown transition-all" style={{ width: `${p.pct}%` }} /></div></div>
      ))}
      {errors.map((e) => <p key={e} className="mt-2 text-sm text-red-700" role="alert">{e}</p>)}
      <p className="mt-2 text-xs text-ink/50">JPG, PNG or WEBP, up to 10MB each. You can select several at once. The first photo is the cover.</p>
    </div>
  );
}

/** Single file uploader for an image or an MP4. */
export function SingleUploader({ kind, folder, value, onDone, onClear, label }: {
  kind: "image" | "video"; folder: "designs" | "videos" | "thumbnails" | "profile" | "site";
  value?: string | null; onDone: (u: Uploaded) => void; onClear?: () => void; label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const go = async (f?: File) => {
    if (!f) return; setErr(null); setPct(0);
    try { onDone(await uploadFile(f, kind, folder, setPct)); } catch (e) { setErr((e as Error).message); }
    setPct(null); if (input.current) input.current.value = "";
  };
  return (
    <div>
      <div className="flex items-center gap-4">
        {kind === "image" && value && <img src={optimize(value, 300)} alt="" className="h-24 w-20 border border-beige object-cover" />}
        {kind === "video" && value && <video src={value} className="h-24 w-40 border border-beige bg-black object-cover" muted preload="metadata" />}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-line !px-4 !py-2.5" disabled={pct !== null} onClick={() => input.current?.click()}>
            {pct !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {pct !== null ? `${pct}%` : value ? `Replace ${label}` : `Upload ${label}`}
          </button>
          {value && onClear && <button type="button" onClick={onClear} className="px-3 text-xs uppercase tracking-wider text-red-700">Remove</button>}
        </div>
      </div>
      {pct !== null && <div className="mt-3 h-1.5 bg-beige"><div className="h-full bg-brown transition-all" style={{ width: `${pct}%` }} /></div>}
      {err && <p className="mt-2 text-sm text-red-700" role="alert">{err}</p>}
      <input ref={input} type="file" accept={(kind === "image" ? IMAGE_TYPES : VIDEO_TYPES).join(",")} className="hidden" onChange={(e) => go(e.target.files?.[0])} />
    </div>
  );
}
