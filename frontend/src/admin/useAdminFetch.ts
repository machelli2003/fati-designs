import { useCallback, useEffect, useState } from "react";
import { admin } from "@/lib/api";

export function useAdminFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const load = useCallback(() => {
    if (!path) return;
    setLoading(true); setError(null);
    admin.get<T>(path).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, setData, error, loading, reload: load };
}
