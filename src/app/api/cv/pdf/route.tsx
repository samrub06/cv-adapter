import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { markdownToCv } from "@/lib/cv/markdown";
import { cvSchema } from "@/lib/cv/schema";
import { getMasterCv } from "@/lib/db/queries";
import { CvPdfDocument } from "@/lib/pdf/CvDocument";

export async function GET() {
  const row = getMasterCv();
  if (!row) {
    return NextResponse.json({ error: "CV maitre introuvable" }, { status: 404 });
  }

  const cv = cvSchema.parse(markdownToCv(row.markdown));
  const buffer = await renderToBuffer(<CvPdfDocument cv={cv} />);
  const slug = cv.identity.name.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug || "cv"}-master.pdf"`,
    },
  });
}
