import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import type { Video } from "@/lib/types";
import { fmtDate, parseEmbed, videoThumb } from "@/lib/media";
import { Img, SampleTag } from "./ui";
import { X } from "lucide-react";

export function VideoModal({ v, onClose }: { v: Video; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  const embed = v.source === "embed" ? parseEmbed(v.video_url) : null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-label={v.title} onClick={onClose}>
      <button onClick={onClose} aria-label="Close video" className="absolute right-4 top-4 p-3 text-ivory"><X /></button>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-video w-full bg-black">
          {v.source === "upload" && v.video_url ? (
            // No autoplay with sound: the viewer presses play themselves.
            <video src={v.video_url} controls playsInline preload="metadata" poster={videoThumb(v)} className="h-full w-full" />
          ) : embed ? (
            <iframe src={embed.src.replace("autoplay=1", "autoplay=0")} title={v.title} className="h-full w-full" allow="fullscreen; picture-in-picture" allowFullScreen />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ivory/70">
              This is a sample video card. Add a real video from the dashboard.
            </div>
          )}
        </div>
        <h3 className="mt-4 text-2xl text-ivory">{v.title}</h3>
        {v.description && <p className="mt-1 text-sm text-ivory/70">{v.description}</p>}
      </div>
    </div>
  );
}

export default function VideoCard({ v }: { v: Video }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="group block w-full text-left" aria-label={`Play ${v.title}`}>
        <div className="relative aspect-video overflow-hidden bg-cream">
          <Img src={videoThumb(v)} alt={v.title} sizes="(min-width:1024px) 33vw, 100vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          {v.is_sample && <SampleTag />}
          <div className="absolute inset-0 flex items-center justify-center bg-ink/20 transition group-hover:bg-ink/35">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ivory/95 text-ink transition group-hover:scale-110"><Play className="ml-0.5 h-5 w-5 fill-current" /></span>
          </div>
        </div>
        <p className="eyebrow mt-3">{v.category === "runway" ? "On the Runway" : "Creative Process"} · {fmtDate(v.created_at)}</p>
        <h3 className="mt-1 text-xl">{v.title}</h3>
        {v.description && <p className="mt-1 line-clamp-2 text-sm text-ink/60">{v.description}</p>}
      </button>
      {open && <VideoModal v={v} onClose={() => setOpen(false)} />}
    </>
  );
}
