import Link from "next/link";
import { notFound } from "next/navigation";
import { AdaptButton } from "@/components/AdaptButton";
import { JobDetailsForm } from "@/components/JobDetailsForm";
import { OutreachForm } from "@/components/OutreachForm";
import { StatusBadge } from "@/components/StatusBadge";
import { getJob, latestAdaptedCv, latestOutreach } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getJob(Number(id));
  if (!job) notFound();
  const adapted = latestAdaptedCv(job.id);
  const outreach = latestOutreach(job.id);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/" className="hover:underline">
              Offres
            </Link>
            <span> / #{job.id}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {job.title || "Offre sans titre"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {job.company || "Entreprise inconnue"}
            {job.url ? (
              <>
                {" · "}
                <a href={job.url} className="underline" target="_blank" rel="noreferrer">
                  source
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={job.status} />
          {job.status === "fetched" || job.status === "adapted" || job.status === "downloaded" ? (
            <AdaptButton jobId={job.id} />
          ) : null}
          {adapted ? (
            <Link
              href={`/jobs/${job.id}/preview`}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium"
            >
              Preview CV
            </Link>
          ) : null}
        </div>
      </div>

      <JobDetailsForm job={job} />
      <OutreachForm jobId={job.id} company={job.company} latest={outreach} />
    </main>
  );
}
