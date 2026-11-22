import { Link } from "react-router-dom";
import type { Design } from "@/lib/types";
import { Img } from "./ui";

export default function DesignCard({ d, tall = false }: { d: Design; tall?: boolean }) {
  return (
    <Link to={`/collections/${d.id}`} className="group block">
      <div className={`relative overflow-hidden bg-cream ${tall ? "aspect-[3/4.4]" : "aspect-[3/4]"}`}>
        <Img src={d.images[0]?.url} alt={d.title} width={800} sizes="(min-width:1024px) 30vw, 50vw"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-ink/0 transition duration-500 group-hover:bg-ink/10" />
      </div>
      <div className="mt-3">
        <p className="eyebrow">{d.category}</p>
        <h3 className="mt-1 text-xl leading-tight transition group-hover:text-brown">{d.title}</h3>
      </div>
    </Link>
  );
}
