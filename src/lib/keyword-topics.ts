function clean(value: string | undefined): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n")
    .replace(/<\/li>|<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8217;|&#039;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

export function extractKeywordTopics(value: string | undefined): string[] {
  const raw = String(value ?? "");
  const items = Array.from(raw.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)).map((match) => match[1]);
  const chunks = items.length ? items : clean(raw).split(/\r?\n+|\s*[;|]\s*/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const chunk of chunks) {
    const cleaned = clean(chunk);
    if (!cleaned) continue;
    const topic = cleaned.includes(":") ? cleaned.split(":")[0] : cleaned;
    const normalized = topic.replace(/\s+/g, " ").trim();
    if (!normalized || /^keywords?$/i.test(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}
