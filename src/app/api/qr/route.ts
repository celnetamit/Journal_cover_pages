import type { NextRequest } from "next/server";
import QRCode from "qrcode";

// Generate a QR-code PNG for an arbitrary URL/text passed as ?data=. Served
// same-origin so it both displays and rasterizes into the html2canvas PDF
// export. Used by the Manuscript page to encode each journal's submission URL.
export async function GET(request: NextRequest) {
  const data = request.nextUrl.searchParams.get("data")?.trim();
  if (!data) return new Response("Missing data", { status: 400 });
  if (data.length > 1024) return new Response("Data too long", { status: 400 });

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 240,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    return new Response(Buffer.from(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("QR generation failed", { status: 500 });
  }
}
