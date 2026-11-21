import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { SiteSettings } from "@/lib/types";

const FALLBACK: SiteSettings = {
  brand_name: "FATI DESIGNS", tagline: "Designed with Passion. Crafted with Precision.",
  hero_heading: "Where Creativity Meets Craftsmanship.", hero_description: "", hero_image_url: "/placeholders/hero.svg",
  about_heading: "Hello, I'm Fati.", about_bio: "", profile_image_url: "/placeholders/portrait.svg",
  whatsapp_number: "", instagram_url: "", email: "", phone: "", location: "",
};
interface Ctx { settings: SiteSettings; loading: boolean; error: boolean; reload: () => void }
const SettingsCtx = createContext<Ctx>({ settings: FALLBACK, loading: true, error: false, reload: () => {} });
export const useSettings = () => useContext(SettingsCtx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = () => {
    api<SiteSettings>("/api/settings")
      .then((s) => { setSettings({ ...FALLBACK, ...s }); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);
  return <SettingsCtx.Provider value={{ settings, loading, error, reload: load }}>{children}</SettingsCtx.Provider>;
}
