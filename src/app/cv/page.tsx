import { CvEditor } from "@/components/CvEditor";
import { markdownToCv } from "@/lib/cv/markdown";
import { flatSkills } from "@/lib/cv/schema";
import { getMasterCv } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function MasterCvPage() {
  const row = getMasterCv();
  const markdown = row?.markdown ?? "";
  const parsed = markdownToCv(markdown);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CV maitre</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Source de verite. L&apos;adaptation ne peut pas inventer d&apos;experiences, diplomes ou skills
            absents d&apos;ici.
          </p>
        </div>
        <a
          href="/api/cv/pdf"
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-medium text-white"
        >
          Telecharger le PDF ATS
        </a>
      </div>
      <CvEditor markdown={markdown} />
      <section className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-sm">
        <h2 className="font-semibold">JSON parse</h2>
        <p className="mt-1 text-zinc-600">
          {parsed.identity.name || "Sans nom"} · {parsed.experiences.length} experiences ·{" "}
          {flatSkills(parsed).length} skills · {parsed.projects.length} projets
        </p>
        <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-white p-3 text-xs">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      </section>
    </main>
  );
}
