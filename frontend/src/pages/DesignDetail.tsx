import { ArrowLeft, MessageCircle, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Lightbox from "@/components/Lightbox";
import { ErrorState, Img, Loading, SampleTag } from "@/components/ui";
import { useSettings } from "@/context/SettingsContext";
import { fmtDate, whatsappLink } from "@/lib/media";
import { useSeo } from "@/lib/seo";
import { useFetch } from "@/lib/useFetch";
import type { Design } from "@/lib/types";

export default function DesignDetail() {
  const { id } = useParams();
  const { settings: s } = useSettings();
  const { data: d, error, loading, reload } = useFetch<Design>(`/api/designs/${id}`);
  const [lb, setLb] = useState<number | null>(null);
  useSeo(d ? `${d.title} | ${s.brand_name}` : s.brand_name, d?.description || "Design by Fati", d?.images[0]?.url);

  if (loading) return <div className="pt-24"><Loading /></div>;
  if (error || !d) return <div className="pt-24"><ErrorState message={error === "Design not found" ? "This design is no longer available." : error || "Something went wrong."} onRetry={reload} /></div>;
  const wa = whatsappLink(s.whatsapp_number, `Hello Fati, I'm interested in "${d.title}".`);

  return (
    <div className="container-x pb-24 pt-28">
      <Link to="/collections" className="eyebrow inline-flex items-center gap-2 hover:text-ink"><ArrowLeft className="h-3.5 w-3.5" /> Back to collections</Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {d.images.length === 0 && <div className="aspect-[3/4] bg-cream" />}
          {d.images.map((img, i) => (
            <button key={i} onClick={() => setLb(i)} aria-label={`Enlarge photo ${i + 1}`}
              className={`group relative overflow-hidden bg-cream ${i === 0 ? "aspect-[3/4] sm:col-span-2 sm:aspect-[4/5]" : "aspect-[3/4]"}`}>
              <Img src={img.url} alt={`${d.title} photo ${i + 1}`} width={i === 0 ? 1200 : 700} eager={i === 0} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              {i === 0 && d.is_sample && <SampleTag />}
              <span className="absolute bottom-3 right-3 bg-ivory/90 p-2 opacity-0 transition group-hover:opacity-100"><ZoomIn className="h-4 w-4" /></span>
            </button>
          ))}
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{d.category}{d.collection_name ? ` · ${d.collection_name}` : ""}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{d.title}</h1>
          {d.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-ink/70">{d.description}</p>}
          <p className="mt-6 text-xs uppercase tracking-widest text-ink/50">Added {fmtDate(d.created_at)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-dark"><MessageCircle className="h-4 w-4" /> Enquire on WhatsApp</a>}
            <Link to="/contact" className="btn btn-line">Send an enquiry</Link>
          </div>
        </div>
      </div>
      {lb !== null && <Lightbox images={d.images} index={lb} onIndex={setLb} onClose={() => setLb(null)} title={d.title} />}
    </div>
  );
}
