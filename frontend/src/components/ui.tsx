import { AlertCircle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { optimize, srcSet } from "@/lib/media";

export function Img({ src, alt, width, sizes, className = "", eager = false }: {
  src?: string | null; alt: string; width?: number; sizes?: string; className?: string; eager?: boolean;
}) {
  if (!src) return <div className={`bg-cream ${className}`} aria-label={alt} role="img" />;
  return (
    <img src={optimize(src, width)} srcSet={srcSet(src)} sizes={sizes} alt={alt}
      loading={eager ? "eager" : "lazy"} decoding="async" className={className} />
  );
}

export const Loading = ({ label = "Loading" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-24 text-brown" role="status">
    <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">{label}...</span>
  </div>
);
export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="mx-auto max-w-md py-20 text-center" role="alert">
    <AlertCircle className="mx-auto mb-4 h-8 w-8 text-brown" />
    <p className="mb-5 text-sm text-ink/70">{message}</p>
    {onRetry && <button onClick={onRetry} className="btn btn-line">Try again</button>}
  </div>
);
export const Empty = ({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) => (
  <div className="mx-auto max-w-md py-20 text-center">
    <h3 className="mb-2 text-2xl">{title}</h3>
    {hint && <p className="mb-5 text-sm text-ink/60">{hint}</p>}
    {action}
  </div>
);
export function SectionTitle({ eyebrow, title, link }: { eyebrow: string; title: string; link?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div><p className="eyebrow mb-3">{eyebrow}</p><h2 className="text-4xl sm:text-5xl">{title}</h2></div>
      {link}
    </div>
  );
}
