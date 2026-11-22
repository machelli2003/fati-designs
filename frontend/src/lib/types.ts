export interface ImageRef { url: string; public_id?: string | null }
export interface Design {
  id: string; title: string; description: string; category: string;
  collection_id: string | null; collection_name?: string | null;
  images: ImageRef[]; featured: boolean; status: "draft" | "published";
  created_at: string;
}
export interface Collection {
  id: string; name: string; description: string; cover_url?: string | null;
  cover_public_id?: string | null; status: "draft" | "published";
  design_count?: number; created_at: string;
}
export interface Video {
  id: string; title: string; description: string; category: "runway" | "process";
  source: "upload" | "embed"; video_url: string; video_public_id?: string | null;
  thumbnail_url?: string | null; thumbnail_public_id?: string | null;
  status: "draft" | "published"; created_at: string;
}
export interface Inquiry {
  id: string; name: string; contact: string; service: string; message: string;
  status: "new" | "contacted" | "completed"; created_at: string;
}
export interface SiteSettings {
  brand_name: string; tagline: string; hero_heading: string; hero_description: string;
  hero_image_url?: string | null; about_heading: string; about_bio: string;
  profile_image_url?: string | null; whatsapp_number: string; instagram_url: string;
  email: string; phone: string; location: string;
}
export interface Paged<T> { items: T[]; total: number; page: number; pages: number }
export interface Stats {
  designs: number; collections: number; videos: number; inquiries: number;
  new_inquiries: number; storage_configured: boolean;
  recent_designs: Design[]; recent_inquiries: Inquiry[];
}
export const CATEGORIES = [
  "Dresses", "Traditional Wear", "Casual Wear", "Bridal and Occasion Wear", "Custom Designs", "Other Creations",
];
export const SERVICES = ["Custom Dress", "Traditional Wear", "Bridal / Occasion Wear", "Alterations", "Other"];
