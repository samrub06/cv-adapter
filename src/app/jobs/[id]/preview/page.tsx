import Link from "next/link";
import { notFound } from "next/navigation";
import { cvSchema, type Cv } from "@/lib/cv/schema";
import { cvDiff } from "@/lib/cv/sanitize";
import { latestAdaptedCv, parseMasterCvJson, getJob } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const jobId = Number(id);
  const job = getJob(jobId);
  const adaptedRow = latestAdaptedCv(jobId);
  if (!job || !adaptedRow) notFound();

  const master = parseMasterCvJson();
  const adapted = cvSchema.parse(JSON.parse(adaptedRow.cvJson));
  const diff = cvDiff(master, adapted);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href={`/jobs/${job.id}`} className="hover:underline">
              Offre
            </Link>
            <span> / preview</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">CV adapte</h1>
          <p className="text-sm text-zinc-500">
            {adaptedRow.model} · {adaptedRow.promptVersion}
          </p>
        </div>
        <a
          href={`/api/jobs/${job.id}/pdf`}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
        >
          Telecharger le PDF
        </a>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
        <h2 className="font-semibold">Diff vs CV maitre</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-700">
          <li>Titre : {diff.titleChanged ? "modifie" : "inchange"}</li>
          <li>Summary : {diff.summaryChanged ? "reformule" : "inchange"}</li>
          <li>
            Experiences : {diff.experienceReordered ? "reordonnees" : "meme ordre"}
          </li>
          <li>Skills conserves : {diff.skillsKept.join(", ") || "aucun"}</li>
          <li>Skills masques pour cette offre : {diff.skillsDropped.join(", ") || "aucun"}</li>
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-500">Maitre</h2>
          <CvView cv={master} />
        </article>
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-500">Adapte</h2>
          <CvView cv={adapted} />
        </article>
      </div>
    </main>
  );
}

function CvView({ cv }: { cv: Cv }) {
  return (
    <div className="mt-3 space-y-4 text-sm">
      <div>
        <p className="text-lg font-semibold text-[#1f3864]">{cv.identity.name}</p>
        <p className="text-zinc-600">{cv.identity.title}</p>
        {cv.highlights.length > 0 ? (
          <p className="mt-1 text-xs text-zinc-500">{cv.highlights.join(" · ")}</p>
        ) : null}
      </div>
      <p className="leading-snug">{cv.summary.replace(/\s+/g, " ").trim()}</p>
      {cv.skillGroups.length > 0 ? (
        <div>
          <p className="font-semibold uppercase text-[#1f3864]">Technical Skills</p>
          {cv.skillGroups.map((group) => (
            <p key={group.name}>
              {group.name ? <span className="font-semibold">- {group.name} : </span> : "- "}
              {group.items.join(", ")}
            </p>
          ))}
        </div>
      ) : null}
      <div>
        <p className="font-semibold uppercase text-[#1f3864]">Professional Experience</p>
        {cv.experiences.map((exp) => (
          <div key={`${exp.company}-${exp.role}-${exp.start}`} className="mt-2">
            <p className="font-medium">
              {exp.company}
              {exp.companyDetail ? (
                <span className="font-normal italic text-zinc-500"> ({exp.companyDetail})</span>
              ) : null}
              {exp.start || exp.end ? (
                <span className="float-right text-xs font-normal text-zinc-500">
                  {exp.start} – {exp.end}
                </span>
              ) : null}
            </p>
            <p className="text-xs italic text-zinc-600">
              {exp.role}
              {exp.location ? ` | ${exp.location}` : ""}
            </p>
            <ul className="mt-1 list-disc pl-5">
              {exp.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {cv.projects.length > 0 ? (
        <div>
          <p className="font-semibold uppercase text-[#1f3864]">Projects</p>
          {cv.projects.map((project) => (
            <div key={project.name} className="mt-2">
              <p className="font-medium">
                {project.name}
                {project.detail ? (
                  <span className="font-normal italic text-zinc-500"> ({project.detail})</span>
                ) : null}
              </p>
              <ul className="mt-1 list-disc pl-5">
                {project.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
