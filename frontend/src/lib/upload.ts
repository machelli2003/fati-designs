import { admin } from "./api";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 100;

export interface Uploaded { url: string; public_id: string }
interface Sig {
  signature: string; timestamp: number; folder: string; allowed_formats: string;
  api_key: string; cloud_name: string; resource_type: string;
}

export function validateFile(file: File, kind: "image" | "video"): string | null {
  const okTypes = kind === "image" ? IMAGE_TYPES : VIDEO_TYPES;
  const max = (kind === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB) * 1024 * 1024;
  if (!okTypes.includes(file.type)) return `${file.name}: ${kind === "image" ? "use JPG, PNG or WEBP" : "use an MP4 video"}`;
  if (file.size > max) return `${file.name}: too large (max ${kind === "image" ? MAX_IMAGE_MB : MAX_VIDEO_MB}MB)`;
  return null;
}

export async function uploadFile(
  file: File, kind: "image" | "video",
  folder: "designs" | "videos" | "thumbnails" | "profile" | "site",
  onProgress?: (pct: number) => void,
): Promise<Uploaded> {
  const err = validateFile(file, kind);
  if (err) throw new Error(err);
  const sig = await admin.post<Sig>("/upload/sign", { resource_type: kind, folder });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.api_key);
  form.append("timestamp", String(sig.timestamp));
  form.append("signature", sig.signature);
  form.append("folder", sig.folder);
  form.append("allowed_formats", sig.allowed_formats);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${sig.resource_type}/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onerror = () => reject(new Error(`${file.name}: network error during upload`));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ url: data.secure_url, public_id: data.public_id });
        else reject(new Error(`${file.name}: ${data?.error?.message || "upload failed"}`));
      } catch { reject(new Error(`${file.name}: upload failed`)); }
    };
    xhr.send(form);
  });
}
