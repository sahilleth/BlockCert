import { toast } from "sonner";
import { assetUrl } from "@/lib/api";

/** Trigger a file download for a same-or-cross-origin asset. */
export async function downloadAsset(
  path: string,
  filename: string,
  label = "File",
) {
  const url = assetUrl(path);
  if (!url) {
    toast.error("Nothing to download");
    return;
  }
  try {
    const res = await fetch(url, { credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    toast.success(`${label} downloaded`);
  } catch (err) {
    // Fallback: open in new tab
    window.open(url, "_blank", "noopener,noreferrer");
    toast.message(`${label} opened in a new tab`, {
      description: err instanceof Error ? err.message : undefined,
    });
  }
}
