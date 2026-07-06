// Wrap a possibly-remote image URL so it is always served same-origin. Remote
// http(s) images are routed through /api/img (a server-side proxy) so they both
// display AND rasterize into the html2canvas PDF export (cross-origin images
// otherwise come out blank). Local, data: and blob: URLs are returned as-is.
export function proxiedImage(url: string | undefined | null): string {
  return proxiedImageWithOptions(url);
}

export function proxiedGrayscaleImage(url: string | undefined | null): string {
  return proxiedImageWithOptions(url, { grayscale: true });
}

function proxiedImageWithOptions(url: string | undefined | null, options?: { grayscale?: boolean }): string {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("data:") || u.startsWith("blob:")) return u;
  if (u.startsWith("/api/assets/") || u.startsWith("/api/img")) {
    return options?.grayscale ? `${u}${u.includes("?") ? "&" : "?"}grayscale=1` : u;
  }
  if (u.startsWith("/")) return u;
  if (/^https?:\/\//i.test(u)) {
    const grayscale = options?.grayscale ? "&grayscale=1" : "";
    return `/api/img?url=${encodeURIComponent(u)}${grayscale}`;
  }
  return u;
}
