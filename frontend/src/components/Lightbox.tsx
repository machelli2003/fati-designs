import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { optimize } from "@/lib/media";

export default function Lightbox({ images, index, onClose, onIndex, title }: {
  images: { url: string }[]; index: number; onClose: () => void; onIndex: (i: number) => void; title: string;
}) {
  const n = images.length;
  const prev = useCallback(() => onIndex((index - 1 + n) % n), [index, n, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % n), [index, n, onIndex]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose, prev, next]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 animate-fadeIn" role="dialog" aria-modal="true" aria-label={`${title} gallery`} onClick={onClose}>
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 p-3 text-ivory"><X /></button>
      {n > 1 && <>
        <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Previous" className="absolute left-2 p-3 text-ivory sm:left-6"><ChevronLeft className="h-8 w-8" /></button>
        <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Next" className="absolute right-2 p-3 text-ivory sm:right-6"><ChevronRight className="h-8 w-8" /></button>
      </>}
      <img src={optimize(images[index].url, 1800)} alt={`${title} ${index + 1} of ${n}`} onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] object-contain" />
      <p className="absolute bottom-4 text-xs tracking-widest text-ivory/70">{index + 1} / {n}</p>
    </div>
  );
}
