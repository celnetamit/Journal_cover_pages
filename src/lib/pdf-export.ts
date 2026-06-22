export type ExportMode = "cover" | "internal";

// Print geometry (mm). Each PDF page is built at trim + a slug border so the
// press can print past the trim line (bleed) and trim cleanly at the crop marks.
//
//   media box  = trim + 2*SLUG   (SLUG = BLEED + GAP + MARK)
//   bleed box  = trim + 2*BLEED  (artwork is scaled out to fill this)
//   trim box   = the finished page size; crop marks sit at its corners
//
// Doing this at the PDF layer (not in CSS) keeps the on-screen layout and the
// cover overlays untouched: we scale the rasterized page about its centre, so
// every element keeps its position *relative to the trim*.
const BLEED = 3; // artwork extends this far past the trim line
const GAP = 2; // white gap between the bleed edge and the start of a crop mark
const MARK = 4; // crop mark length
const SLUG = BLEED + GAP + MARK; // 9mm white border around the trim, holds the marks

// Trim (finished) size and the on-screen render size of each page, in mm.
// Internal pages render at their trim size (A4). The cover spread renders at
// 431.8×304.8 (17×12") with the artwork already centred in a 12.7mm border,
// i.e. trim = 16×11" centred inside the render.
function geometry(mode: ExportMode) {
  if (mode === "cover") {
    return { trimW: 406.4, trimH: 279.4, renderW: 431.8, renderH: 304.8 };
  }
  return { trimW: 210, trimH: 297, renderW: 210, renderH: 297 };
}

function drawCropMarks(pdf: import("jspdf").jsPDF, tx: number, ty: number, tw: number, th: number) {
  const off = BLEED + GAP; // marks start this far outside the trim (clear of the bleed)
  const L = tx, R = tx + tw, T = ty, B = ty + th;
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.2);
  // Each corner gets one horizontal + one vertical tick, drawn in the white slug.
  pdf.line(L - off - MARK, T, L - off, T); pdf.line(L, T - off - MARK, L, T - off); // top-left
  pdf.line(R + off, T, R + off + MARK, T); pdf.line(R, T - off - MARK, R, T - off); // top-right
  pdf.line(L - off - MARK, B, L - off, B); pdf.line(L, B + off, L, B + off + MARK); // bottom-left
  pdf.line(R + off, B, R + off + MARK, B); pdf.line(R, B + off, R, B + off + MARK); // bottom-right
}

// Rasterizes the currently-mounted #pdf-book to a print-ready PDF (3mm bleed +
// crop marks). Throws on failure so the caller can surface an error; html2canvas
// loads the images in its own clone.
export async function exportBookToPdf(mode: ExportMode, filename: string) {
  const source = document.getElementById("pdf-book");
  if (!source) throw new Error("Export container not found.");
  const pages = Array.from(source.querySelectorAll<HTMLElement>(`.pdf-page[data-export-group="${mode}"]`));
  if (pages.length === 0) throw new Error("No pages were found to export.");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const isCover = mode === "cover";
  const { trimW, trimH, renderW, renderH } = geometry(mode);
  const mediaW = trimW + 2 * SLUG;
  const mediaH = trimH + 2 * SLUG;
  const orientation = isCover ? "landscape" : "portrait";
  const format = [mediaW, mediaH];

  // Only the cover has edge-to-edge artwork that must bleed; scale it about its
  // centre so the trim region lands on the trim box and overspills by BLEED. The
  // internal pages have a white background, so we place them at exact trim (their
  // 18/20mm margins are preserved) and the white slug around them acts as bleed.
  const targetW = isCover ? trimW + 2 * BLEED : trimW;
  const targetH = isCover ? trimH + 2 * BLEED : trimH;
  const placedW = renderW * (targetW / trimW);
  const placedH = renderH * (targetH / trimH);
  const placedX = (mediaW - placedW) / 2;
  const placedY = (mediaH - placedH) / 2;

  const pdf = new jsPDF({ orientation, unit: "mm", format });

  for (let index = 0; index < pages.length; index += 1) {
    const { width, height } = pages[index].getBoundingClientRect();
    const canvas = await html2canvas(pages[index], {
      // Higher capture scale keeps text and thin rules crisp when zoomed.
      scale: isCover ? 2.25 : 3.25,
      useCORS: true,
      backgroundColor: "#ffffff",
      width,
      height,
      windowWidth: Math.ceil(width),
      windowHeight: Math.ceil(height),
    });
    // Internal pages stay lossless PNG for sharp text; the cover stays JPEG to cap file size.
    const imgData = isCover ? canvas.toDataURL("image/jpeg", 0.94) : canvas.toDataURL("image/png");
    if (index > 0) pdf.addPage(format, orientation);
    pdf.addImage(imgData, isCover ? "JPEG" : "PNG", placedX, placedY, placedW, placedH, undefined, "FAST");
    drawCropMarks(pdf, SLUG, SLUG, trimW, trimH);
  }

  pdf.save(filename);
}
