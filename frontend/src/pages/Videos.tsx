import { useState } from "react";
import VideoCard from "@/components/VideoCard";
import { Empty, ErrorState, Loading } from "@/components/ui";
import { useSeo } from "@/lib/seo";
import { useFetch } from "@/lib/useFetch";
import type { Video } from "@/lib/types";

const TABS = [["all", "All"], ["runway", "Fati on the Runway"], ["process", "The Creative Process"]] as const;

export default function Videos() {
  useSeo("Videos | FATI DESIGNS", "Watch models wear Fati's creations and see how each garment is cut, sewn and finished.");
  const { data, error, loading, reload } = useFetch<Video[]>("/api/videos");
  const [tab, setTab] = useState<string>("all");
  const list = (data || []).filter((v) => tab === "all" || v.category === tab);
  return (
    <div className="container-x pb-24 pt-32">
      <p className="eyebrow mb-3">Watch</p>
      <h1 className="text-5xl sm:text-7xl">Videos</h1>
      <div className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`whitespace-nowrap border px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] transition ${tab === k ? "border-ink bg-ink text-ivory" : "border-beige hover:border-ink"}`}>{l}</button>
        ))}
      </div>
      {error ? <ErrorState message={error} onRetry={reload} />
        : loading ? <Loading />
        : list.length === 0 ? <Empty title="No videos yet" hint="Check back soon." />
        : <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{list.map((v) => <VideoCard key={v.id} v={v} />)}</div>}
    </div>
  );
}
