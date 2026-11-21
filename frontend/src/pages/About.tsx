import { Link } from "react-router-dom";
import { Img } from "@/components/ui";
import { useSettings } from "@/context/SettingsContext";
import { useSeo } from "@/lib/seo";
import { useFetch } from "@/lib/useFetch";
import type { Design, Paged } from "@/lib/types";

export default function About() {
  const { settings: s } = useSettings();
  useSeo(`About | ${s.brand_name}`, s.about_bio.slice(0, 155) || "About Fati, fashion designer.", s.profile_image_url);
  const work = useFetch<Paged<Design>>("/api/designs?limit=3");
  const paragraphs = s.about_bio.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="pb-24 pt-32">
      <div className="container-x grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        <div className="aspect-[4/5] overflow-hidden bg-cream md:sticky md:top-28 md:self-start">
          <Img src={s.profile_image_url} alt="Portrait of Fati" width={1000} eager className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="eyebrow mb-4">About</p>
          <h1 className="text-5xl sm:text-7xl">{s.about_heading}</h1>
          <div className="mt-8 space-y-5 text-[16px] leading-relaxed text-ink/75">
            {paragraphs.map((p, i) => <p key={i} className={i === 0 ? "font-serif text-2xl leading-snug text-ink" : ""}>{p}</p>)}
          </div>
          <div className="mt-10 grid gap-5 border-t border-beige pt-8 text-left sm:grid-cols-3 sm:gap-4 sm:text-center">
            {[["Design", "Every piece begins as a sketch"], ["Craft", "Cut and sewn by hand"], ["Fit", "Made around you"]].map(([t, d]) => (
              <div key={t}><p className="font-serif text-2xl">{t}</p><p className="mt-1 text-xs text-ink/60">{d}</p></div>
            ))}
          </div>
          <Link to="/contact" className="btn btn-dark mt-10">Work with Fati</Link>
        </div>
      </div>
      {(work.data?.items.length || 0) > 0 && (
        <div className="container-x mt-24">
          <p className="eyebrow mb-6">In the studio</p>
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {work.data!.items.map((d) => <div key={d.id} className="aspect-[3/4] overflow-hidden bg-cream"><Img src={d.images[0]?.url} alt={d.title} width={700} className="h-full w-full object-cover" /></div>)}
          </div>
          <p className="mt-3 text-xs text-ink/50">Studio photographs can be added from the admin dashboard.</p>
        </div>
      )}
    </div>
  );
}
