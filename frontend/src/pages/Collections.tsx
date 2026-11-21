import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DesignCard from "@/components/DesignCard";
import { Empty, ErrorState, Img, Loading } from "@/components/ui";
import { api } from "@/lib/api";
import { useFetch } from "@/lib/useFetch";
import { useSeo } from "@/lib/seo";
import { CATEGORIES, type Collection, type Design, type Paged } from "@/lib/types";

export default function Collections() {
  useSeo("Collections | FATI DESIGNS", "Browse handcrafted dresses, traditional wear, bridal and custom designs by Fati.");
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const collection = params.get("collection") || "";
  const [items, setItems] = useState<Design[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cols = useFetch<Collection[]>("/api/collections");

  const load = (p: number) => {
    const q = new URLSearchParams({ page: String(p), limit: "12" });
    if (category) q.set("category", category);
    if (collection) q.set("collection", collection);
    setLoading(true); setError(null);
    api<Paged<Design>>(`/api/designs?${q}`)
      .then((r) => { setItems((prev) => (p === 1 ? r.items : [...prev, ...r.items])); setPage(r.page); setPages(r.pages); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(1); }, [category, collection]);

  const set = (k: string, v: string) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); setParams(n); };
  const activeCol = cols.data?.find((c) => c.id === collection);
  const chip = (on: boolean) => `whitespace-nowrap border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${on ? "border-ink bg-ink text-ivory" : "border-beige hover:border-ink"}`;

  return (
    <div className="container-x pb-24 pt-32">
      <p className="eyebrow mb-3">The work</p>
      <h1 className="text-5xl sm:text-7xl">{activeCol ? activeCol.name : "Collections"}</h1>
      {activeCol?.description && <p className="mt-4 max-w-xl text-ink/70">{activeCol.description}</p>}

      {!collection && (cols.data?.length || 0) > 0 && (
        <div className="mt-10 flex gap-4 overflow-x-auto pb-2">
          {cols.data!.map((c) => (
            <button key={c.id} onClick={() => set("collection", c.id)} className="group w-40 shrink-0 text-left">
              <div className="aspect-[4/5] overflow-hidden bg-cream"><Img src={c.cover_url} alt={c.name} width={400} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <p className="mt-2 font-serif text-lg">{c.name}</p>
            </button>
          ))}
        </div>
      )}

      <div className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by category">
        <button className={chip(!category && !collection)} onClick={() => setParams({})}>All</button>
        {CATEGORIES.map((c) => <button key={c} className={chip(category === c)} aria-pressed={category === c} onClick={() => set("category", category === c ? "" : c)}>{c}</button>)}
        {collection && <button className={chip(true)} onClick={() => set("collection", "")}>✕ Collection</button>}
      </div>

      {error ? <ErrorState message={error} onRetry={() => load(1)} />
        : loading && items.length === 0 ? <Loading />
        : items.length === 0 ? <Empty title="Nothing here yet" hint="No designs match this filter." action={<Link to="/collections" onClick={() => setParams({})} className="btn btn-line">Clear filters</Link>} />
        : (
          <>
            <div className="mt-10 columns-2 gap-4 lg:columns-3 lg:gap-8 [&>*]:mb-10 [&>*]:break-inside-avoid">
              {items.map((d, i) => <DesignCard key={d.id} d={d} tall={i % 3 === 0} />)}
            </div>
            {page < pages && (
              <div className="mt-6 text-center">
                <button className="btn btn-line" disabled={loading} onClick={() => load(page + 1)}>{loading ? "Loading..." : "Load more"}</button>
              </div>
            )}
          </>
        )}
    </div>
  );
}
