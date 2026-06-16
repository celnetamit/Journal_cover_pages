export type ExportMode = "cover" | "internal";

// Rasterizes the currently-mounted #pdf-book to a PDF. Throws on failure so the
// caller can surface an error; html2canvas loads the images in its own clone.
export async function exportBookToPdf(mode: ExportMode, filename: string) {
  const source = document.getElementById("pdf-book");
  if (!source) throw new Error("Export container not found.");
  const pages = Array.from(source.querySelectorAll<HTMLElement>(`.pdf-page[data-export-group="${mode}"]`));
  if (pages.length === 0) throw new Error("No pages were found to export.");
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const firstLandscape = pages[0]?.classList.contains("cover-spread-page");
  const pdfFormat = mode === "cover" ? [431.8, 304.8] : "a4";
  const pdf = new jsPDF({
    orientation: firstLandscape ? "landscape" : "portrait",
    unit: "mm",
    format: pdfFormat,
  });

  for (let index = 0; index < pages.length; index += 1) {
    const landscape = pages[index].classList.contains("cover-spread-page");
    const pageWidth = mode === "cover" ? 431.8 : landscape ? 297 : 210;
    const pageHeight = mode === "cover" ? 304.8 : landscape ? 210 : 297;
    const { width, height } = pages[index].getBoundingClientRect();
    const isCover = mode === "cover";
    const canvas = await html2canvas(pages[index], {
      // Use a higher capture scale to keep text and thin rules crisp when users zoom the exported PDF.
      scale: isCover ? 2.25 : 3.25,
      useCORS: true,
      backgroundColor: "#ffffff",
      width,
      height,
      windowWidth: Math.ceil(width),
      windowHeight: Math.ceil(height),
    });
    // Keep the internal pages lossless for sharper text; the cover spread stays JPEG to avoid huge files.
    const imgData = isCover ? canvas.toDataURL("image/jpeg", 0.94) : canvas.toDataURL("image/png");
    if (index > 0) pdf.addPage(pdfFormat, landscape ? "landscape" : "portrait");
    pdf.addImage(imgData, isCover ? "JPEG" : "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
  }

  pdf.save(filename);
}
