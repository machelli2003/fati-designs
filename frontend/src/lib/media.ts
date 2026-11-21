const isCloudinary = (u: string) => u.includes("res.cloudinary.com") && u.includes("/upload/");

/** Insert Cloudinary transformations (auto format/quality + width). Other URLs pass through untouched. */
export function optimize(url: string | null | undefined, width?: number): string {
  if (!url) return "";
  if (!isCloudinary(url)) return url;
  const t = `f_auto,q_auto${width ? `,w_${width},c_limit` : ""}`;
  return url.replace("/upload/", `/upload/${t}/`);
}
export function srcSet(url: string | null | undefined, widths = [480, 800, 1200]): string | undefined {
  if (!url || !isCloudinary(url)) return undefined;
  return widths.map((w) => `${optimize(url, w)} ${w}w`).join(", ");
}

export function whatsappLink(number: string, text = "Hello Fati, I'd like to enquire about a design."): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : "";
}

export interface EmbedInfo { kind: "youtube" | "vimeo"; src: string }
export function parseEmbed(url: string): EmbedInfo | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return { kind: "youtube", src: `https://www.youtube.com/embed/${u.pathname.slice(1)}?rel=0&autoplay=1` };
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").filter(Boolean).pop();
      return id ? { kind: "youtube", src: `https://www.youtube.com/embed/${id}?rel=0&autoplay=1` } : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? { kind: "vimeo", src: `https://player.vimeo.com/video/${id}?autoplay=1` } : null;
    }
  } catch { /* invalid URL */ }
  return null;
}
export function youtubeThumb(url: string): string | null {
  const e = parseEmbed(url);
  if (e?.kind !== "youtube") return null;
  const id = e.src.split("/embed/")[1].split("?")[0];
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
/** Best available thumbnail for a video record. */
export function videoThumb(v: { thumbnail_url?: string | null; video_url: string; source: string }): string {
  if (v.thumbnail_url) return optimize(v.thumbnail_url, 800);
  if (v.source === "upload" && isCloudinary(v.video_url))
    return v.video_url.replace("/upload/", "/upload/so_1,w_800,c_fill,ar_16:9,f_jpg/").replace(/\.\w+$/, ".jpg");
  if (v.source === "embed") return youtubeThumb(v.video_url) || "";
  return "";
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
