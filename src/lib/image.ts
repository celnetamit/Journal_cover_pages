// Wrap a possibly-remote image URL so it is always served same-origin. Remote
// http(s) images are routed through /api/img (a server-side proxy) so they both
// display AND rasterize into the html2canvas PDF export (cross-origin images
// otherwise come out blank). Local, data: and blob: URLs are returned as-is.
export function proxiedImage(url: string | undefined | null): string {
  const u = (url || "").trim();
  if (!u) return "";
  if (u.startsWith("/") || u.startsWith("data:") || u.startsWith("blob:")) return u;
  if (/^https?:\/\//i.test(u)) return `/api/img?url=${encodeURIComponent(u)}`;
  return u;
}
