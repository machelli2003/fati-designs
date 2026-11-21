import { CheckCircle2, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useSettings } from "@/context/SettingsContext";
import { api } from "@/lib/api";
import { whatsappLink } from "@/lib/media";
import { useSeo } from "@/lib/seo";
import { SERVICES } from "@/lib/types";

export default function Contact() {
  const { settings: s } = useSettings();
  useSeo(`Contact | ${s.brand_name}`, "Get in touch with Fati for custom designs, bridal wear and alterations.");
  const [f, setF] = useState({ name: "", contact: "", service: SERVICES[0], message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const wa = whatsappLink(s.whatsapp_number);
  const up = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await api("/api/inquiries", { method: "POST", body: f }); setDone(true); }
    catch (x) { setErr((x as Error).message); }
    finally { setBusy(false); }
  };
  const row = (icon: React.ReactNode, text: string, href?: string) => text && (
    <li className="flex items-start gap-3">{icon}{href ? <a href={href} className="hover:text-brown">{text}</a> : <span>{text}</span>}</li>
  );

  return (
    <div className="container-x pb-24 pt-32">
      <p className="eyebrow mb-3">Contact</p>
      <h1 className="text-5xl sm:text-7xl">Let's talk.</h1>
      <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <div>
          <p className="max-w-sm leading-relaxed text-ink/70">Tell me about the piece you have in mind, the occasion and your timeline. I'll get back to you as soon as I can.</p>
          <ul className="mt-8 space-y-4 text-sm">
            {row(<MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-brown" />, s.location)}
            {row(<Phone className="h-4 w-4 shrink-0 translate-y-0.5 text-brown" />, s.phone, s.phone ? `tel:${s.phone}` : undefined)}
            {row(<Mail className="h-4 w-4 shrink-0 translate-y-0.5 text-brown" />, s.email, s.email ? `mailto:${s.email}` : undefined)}
            {s.instagram_url && row(<Instagram className="h-4 w-4 shrink-0 translate-y-0.5 text-brown" />, "Instagram", s.instagram_url)}
          </ul>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-dark mt-8"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a>}
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center bg-cream p-12 text-center" role="status">
            <CheckCircle2 className="mb-4 h-10 w-10 text-brown" />
            <h2 className="text-3xl">Thank you!</h2>
            <p className="mt-2 max-w-xs text-sm text-ink/70">Your enquiry has been received. Fati will be in touch soon.</p>
            <button className="btn btn-line mt-6" onClick={() => { setDone(false); setF({ ...f, message: "" }); }}>Send another</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5" noValidate>
            <div><label className="label" htmlFor="name">Full name</label><input id="name" className="field" required minLength={2} maxLength={120} value={f.name} onChange={up("name")} autoComplete="name" /></div>
            <div><label className="label" htmlFor="contact">Email or phone</label><input id="contact" className="field" required maxLength={160} value={f.contact} onChange={up("contact")} autoComplete="email" /></div>
            <div><label className="label" htmlFor="service">Service interested in</label>
              <select id="service" className="field" value={f.service} onChange={up("service")}>{SERVICES.map((x) => <option key={x}>{x}</option>)}</select></div>
            <div><label className="label" htmlFor="message">Message</label><textarea id="message" rows={6} className="field" required minLength={5} maxLength={3000} value={f.message} onChange={up("message")} /></div>
            {/* Honeypot: hidden from people, bots fill it in */}
            <div className="absolute -left-[9999px]" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={up("website")} /></label></div>
            {err && <p className="text-sm text-red-700" role="alert">{err}</p>}
            <button className="btn btn-dark w-full sm:w-auto" disabled={busy}>{busy ? "Sending..." : "Send enquiry"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
