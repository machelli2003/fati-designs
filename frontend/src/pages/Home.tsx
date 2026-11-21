import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import DesignCard from "@/components/DesignCard";
import VideoCard from "@/components/VideoCard";
import { Img, SectionTitle } from "@/components/ui";
import { useSettings } from "@/context/SettingsContext";
import { useFetch } from "@/lib/useFetch";
import { whatsappLink } from "@/lib/media";
import { useSeo } from "@/lib/seo";
import type { Collection, Design, Paged, Video } from "@/lib/types";

export default function Home() {
  const { settings: s } = useSettings();
  useSeo(`${s.brand_name} | Fashion Designer`, s.hero_description || s.tagline, s.hero_image_url);
  const featured = useFetch<Paged<Design>>("/api/designs?featured=true&limit=6");
  const latest = useFetch<Paged<Design>>("/api/designs?limit=4");
  const collections = useFetch<Collection[]>("/api/collections");
  const videos = useFetch<Video[]>("/api/videos");
  const wa = whatsappLink(s.whatsapp_number);
  const runway = (videos.data || []).filter((v) => v.category === "runway").slice(0, 2);
  const process = (videos.data || []).filter((v) => v.category === "process").slice(0, 3);
  const feat = featured.data?.items || [];

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[100svh] bg-cream">
        <div className="absolute inset-0 md:left-[46%]">
          <Img src={s.hero_image_url} alt={`${s.brand_name} featured design`} width={1600} eager className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink/35 md:hidden" />
        </div>
        <div className="container-x relative flex min-h-[100svh] items-end pb-16 pt-28 md:items-center md:pb-0">
          <div className="max-w-xl animate-fadeUp text-ivory md:max-w-[44%] md:pr-10 md:text-ink">
            <p className="eyebrow mb-5 !text-beige md:!text-brown">{s.tagline}</p>
            <h1 className="text-[2.9rem] leading-[1.02] sm:text-6xl lg:text-7xl">{s.hero_heading}</h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ivory/85 md:text-ink/70">{s.hero_description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/collections" className="btn btn-dark !bg-ivory !text-ink hover:!bg-beige md:!bg-ink md:!text-ivory md:hover:!bg-brown">Explore Collections <ArrowRight className="h-4 w-4" /></Link>
              {wa
                ? <a href={wa} target="_blank" rel="noreferrer" className="btn btn-light md:!border-ink md:!text-ink md:hover:!bg-ink md:hover:!text-ivory"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                : <Link to="/contact" className="btn btn-light md:!border-ink md:!text-ink md:hover:!bg-ink md:hover:!text-ivory">Contact</Link>}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {feat.length > 0 && (
        <section className="container-x py-24">
          <SectionTitle eyebrow="Featured creations" title="Pieces we love" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 lg:gap-x-8">
            {feat.map((d, i) => <div key={d.id} className={i % 3 === 1 ? "lg:mt-16" : ""}><DesignCard d={d} tall={i % 2 === 0} /></div>)}
          </div>
        </section>
      )}

      {/* COLLECTIONS */}
      {(collections.data?.length || 0) > 0 && (
        <section className="bg-cream py-24">
          <div className="container-x">
            <SectionTitle eyebrow="Latest collections" title="Collections" link={<Link to="/collections" className="eyebrow underline underline-offset-8">View all</Link>} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.data!.slice(0, 3).map((c) => (
                <Link key={c.id} to={`/collections?collection=${c.id}`} className="group relative block aspect-[4/5] overflow-hidden bg-beige">
                  <Img src={c.cover_url} alt={c.name} width={900} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-6 text-ivory">
                    <h3 className="text-3xl">{c.name}</h3>
                    <p className="mt-1 text-xs uppercase tracking-widest text-beige">{c.design_count} {c.design_count === 1 ? "design" : "designs"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST DESIGNS */}
      {(latest.data?.items.length || 0) > 0 && (
        <section className="container-x py-24">
          <SectionTitle eyebrow="New in" title="Latest designs" link={<Link to="/collections" className="eyebrow underline underline-offset-8">Browse all</Link>} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {latest.data!.items.map((d) => <DesignCard key={d.id} d={d} />)}
          </div>
        </section>
      )}

      {/* RUNWAY VIDEOS */}
      {runway.length > 0 && (
        <section className="bg-ink py-24 text-ivory">
          <div className="container-x">
            <SectionTitle eyebrow="Fashion showcase" title="Fati on the Runway" link={<Link to="/videos" className="eyebrow !text-beige underline underline-offset-8">All videos</Link>} />
            <div className="grid gap-8 md:grid-cols-2 [&_h3]:text-ivory [&_p]:text-ivory/70 [&_.eyebrow]:!text-beige">
              {runway.map((v) => <VideoCard key={v.id} v={v} />)}
            </div>
          </div>
        </section>
      )}

      {/* BEHIND THE SCENES */}
      {process.length > 0 && (
        <section className="container-x py-24">
          <SectionTitle eyebrow="Behind the scenes" title="The creative process" link={<Link to="/videos" className="eyebrow underline underline-offset-8">Watch more</Link>} />
          <div className="grid gap-8 md:grid-cols-3">{process.map((v) => <VideoCard key={v.id} v={v} />)}</div>
        </section>
      )}

      {/* ABOUT */}
      <section className="bg-cream py-24">
        <div className="container-x grid items-center gap-12 md:grid-cols-2 md:gap-20">
          <div className="aspect-[4/5] overflow-hidden bg-beige md:max-w-md">
            <Img src={s.profile_image_url} alt="Fati, fashion designer" width={900} className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="eyebrow mb-4">About the designer</p>
            <h2 className="text-4xl sm:text-5xl">{s.about_heading}</h2>
            <p className="mt-6 line-clamp-6 whitespace-pre-line text-[15px] leading-relaxed text-ink/70">{s.about_bio}</p>
            <Link to="/about" className="btn btn-line mt-8">Read my story</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-28 text-center">
        <p className="eyebrow mb-4">Custom orders</p>
        <h2 className="mx-auto max-w-2xl text-4xl sm:text-6xl">Let's create something made for you.</h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/contact" className="btn btn-dark">Get in touch</Link>
          {wa && <a href={wa} target="_blank" rel="noreferrer" className="btn btn-line"><MessageCircle className="h-4 w-4" /> Chat on WhatsApp</a>}
        </div>
      </section>
    </>
  );
}
