import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Empty, ErrorState, Loading } from "@/components/ui";
import { admin } from "@/lib/api";
import { fmtDate } from "@/lib/media";
import type { Inquiry } from "@/lib/types";
import { Msg, PageHead } from "./parts";
import { useAdminFetch } from "./useAdminFetch";

const STATUSES = ["new", "contacted", "completed"] as const;

export default function Inquiries() {
  const { data, setData, error, loading, reload } = useAdminFetch<Inquiry[]>("/inquiries");
  const [err, setErr] = useState<string | null>(null);
  const setStatus = async (i: Inquiry, status: Inquiry["status"]) => {
    try { await admin.patch(`/inquiries/${i.id}`, { status }); setData((d) => d && d.map((x) => (x.id === i.id ? { ...x, status } : x))); } catch (e) { setErr((e as Error).message); }
  };
  const del = async (i: Inquiry) => {
    if (!confirm(`Delete the inquiry from ${i.name}?`)) return;
    try { await admin.del(`/inquiries/${i.id}`); setData((d) => d && d.filter((x) => x.id !== i.id)); } catch (e) { setErr((e as Error).message); }
  };
  const link = (c: string) => (c.includes("@") ? `mailto:${c}` : `tel:${c}`);
  return (
    <>
      <PageHead title="Inquiries" />
      {err && <Msg kind="error">{err}</Msg>}
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.length ? <Empty title="No inquiries yet" hint="Messages from the contact form will appear here." /> : (
        <ul className="space-y-4">
          {data.map((i) => (
            <li key={i.id} className={`border p-5 ${i.status === "new" ? "border-brown bg-cream/50" : "border-beige"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="font-medium">{i.name}</p>
                  <a href={link(i.contact)} className="text-sm text-brown underline">{i.contact}</a>
                  <p className="mt-1 text-xs text-ink/50">{i.service} · {fmtDate(i.created_at)}</p></div>
                <div className="flex items-center gap-2">
                  <select aria-label="Status" value={i.status} onChange={(e) => setStatus(i, e.target.value as Inquiry["status"])} className="border border-beige bg-white px-3 py-2 text-xs uppercase tracking-wider">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <button onClick={() => del(i)} aria-label={`Delete inquiry from ${i.name}`} className="p-2.5 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink/80">{i.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
