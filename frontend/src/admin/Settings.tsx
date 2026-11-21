import { useEffect, useState, type FormEvent } from "react";
import { ErrorState, Loading } from "@/components/ui";
import { useSettings } from "@/context/SettingsContext";
import { admin } from "@/lib/api";
import type { SiteSettings, Stats } from "@/lib/types";
import { Field, Msg, PageHead, SingleUploader } from "./parts";
import { useAdminFetch } from "./useAdminFetch";

export default function Settings() {
  const { data, error, loading, reload } = useAdminFetch<SiteSettings>("/settings");
  const stats = useAdminFetch<Stats>("/stats");
  const pub = useSettings();
  const [f, setF] = useState<SiteSettings | null>(null);
  const [msg, setMsg] = useState<{ k: "ok" | "error"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (loading) return <Loading />;
  if (error || !f) return <ErrorState message={error || "Failed to load"} onRetry={reload} />;
  const up = (k: keyof SiteSettings) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await admin.put("/settings", f); pub.reload(); setMsg({ k: "ok", t: "Saved. Your website is updated." }); window.scrollTo(0, 0); }
    catch (x) { setMsg({ k: "error", t: (x as Error).message }); window.scrollTo(0, 0); } finally { setBusy(false); }
  };
  const sample = async (remove: boolean) => {
    if (remove && !confirm("Remove all sample designs, collections and videos? Your own content is not touched.")) return;
    try { remove ? await admin.del("/sample-content") : await admin.post("/sample-content"); stats.reload(); setMsg({ k: "ok", t: remove ? "Sample content removed." : "Sample content added." }); }
    catch (x) { setMsg({ k: "error", t: (x as Error).message }); }
  };
  const input = (k: keyof SiteSettings, label: string, hint?: string, type = "text") => (
    <Field label={label} hint={hint}><input type={type} className="field" value={(f[k] as string) || ""} onChange={up(k)} /></Field>
  );
  return (
    <form onSubmit={save} className="max-w-3xl">
      <PageHead title="Website settings" />
      {msg && <Msg kind={msg.k}>{msg.t}</Msg>}
      <section className="space-y-6">
        <h2 className="text-2xl">Brand</h2>
        {input("brand_name", "Brand name")}{input("tagline", "Tagline")}
        <h2 className="pt-4 text-2xl">Home page hero</h2>
        {input("hero_heading", "Hero heading")}
        <Field label="Hero description"><textarea rows={3} className="field" value={f.hero_description} onChange={up("hero_description")} /></Field>
        <Field label="Hero image" hint="A tall or square photo works best."><SingleUploader kind="image" folder="site" label="hero image" value={f.hero_image_url} onDone={(u) => setF({ ...f, hero_image_url: u.url })} onClear={() => setF({ ...f, hero_image_url: null })} /></Field>
        <h2 className="pt-4 text-2xl">About</h2>
        {input("about_heading", "About heading")}
        <Field label="Biography" hint="Separate paragraphs with a blank line."><textarea rows={9} className="field" value={f.about_bio} onChange={up("about_bio")} /></Field>
        <Field label="Profile photograph"><SingleUploader kind="image" folder="profile" label="photo" value={f.profile_image_url} onDone={(u) => setF({ ...f, profile_image_url: u.url })} onClear={() => setF({ ...f, profile_image_url: null })} /></Field>
        <h2 className="pt-4 text-2xl">Contact details</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {input("whatsapp_number", "WhatsApp number", "International format, e.g. 233501234567")}
          {input("phone", "Phone number")}{input("email", "Email address", undefined, "email")}{input("location", "Location")}
        </div>
        {input("instagram_url", "Instagram URL", "e.g. https://instagram.com/yourhandle")}
      </section>
      <div className="mt-8 border-t border-beige pt-6"><button className="btn btn-dark" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button></div>

      <section className="mt-14 border border-beige p-6">
        <h2 className="text-2xl">Sample content</h2>
        <p className="mt-2 text-sm text-ink/70">Placeholder designs, collection and videos are shown so the site isn't empty. {stats.data ? `Currently ${stats.data.sample_items} sample item(s).` : ""} Remove them once you've uploaded your own work.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => sample(true)} className="btn btn-line !border-red-700 !text-red-700 hover:!bg-red-700 hover:!text-white">Remove all sample content</button>
          <button type="button" onClick={() => sample(false)} className="btn btn-line">Add sample content back</button>
        </div>
      </section>
    </form>
  );
}
