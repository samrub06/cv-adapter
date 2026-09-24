import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { cvSchema } from "@/lib/cv/schema";
import { getJob, latestAdaptedCv, updateJob } from "@/lib/db/queries";
import { CvPdfDocument } from "@/lib/pdf/CvDocument";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const jobId = Number(id);
  const job = getJob(jobId);
  const adapted = latestAdaptedCv(jobId);
  if (!job || !adapted) {
    return NextResponse.json({ error: "CV adapte introuvable" }, { status: 404 });
  }

  const cv = cvSchema.parse(JSON.parse(adapted.cvJson));
  const buffer = await renderToBuffer(<CvPdfDocument cv={cv} />);
  updateJob(jobId, { status: "downloaded" });

  const slug = [cv.identity.name, job.company, job.title]
    .filter(Boolean)
    .join("-")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug || "cv"}.pdf"`,
    },
  });
}
