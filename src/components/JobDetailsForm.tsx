import {
  retryExtractFromPastedTextAction,
  saveJobDetailsAction,
} from "@/actions/jobs";
import { SubmitButton } from "./SubmitButton";
import type { JobRow } from "@/lib/db/queries";
import { jobKeywords, jobRequirements } from "@/lib/db/queries";

export function JobDetailsForm({ job }: { job: JobRow }) {
  const requirements = jobRequirements(job).join("\n");
  const keywords = jobKeywords(job).join(", ");

  return (
    <div className="space-y-6">
      {job.status === "failed" ? (
        <form
          action={retryExtractFromPastedTextAction.bind(null, job.id)}
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm font-medium text-red-900">
            Fetch / extraction en echec{job.error ? ` : ${job.error}` : ""}
          </p>
          <p className="mt-1 text-sm text-red-800">
            Colle le texte de l&apos;annonce et relance l&apos;extraction.
          </p>
          <textarea
            name="rawText"
            defaultValue={job.rawText}
            rows={8}
            className="mt-3 w-full rounded-md border border-red-200 bg-white px-3 py-2 text-sm"
          />
          <div className="mt-3">
            <SubmitButton pendingLabel="Extraction...">Reessayer depuis le texte</SubmitButton>
          </div>
        </form>
      ) : null}

      <form
        action={saveJobDetailsAction.bind(null, job.id)}
        className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold">Details de l&apos;offre (editables)</h2>
        <input
          name="title"
          defaultValue={job.title}
          placeholder="Titre"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="grid gap-3 md:grid-cols-3">
          <input
            name="company"
            defaultValue={job.company}
            placeholder="Entreprise"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="location"
            defaultValue={job.location}
            placeholder="Lieu"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="contract"
            defaultValue={job.contract}
            placeholder="Contrat"
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <label className="text-xs font-medium text-zinc-500">Exigences (une par ligne)</label>
        <textarea
          name="requirements"
          defaultValue={requirements}
          rows={6}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="text-xs font-medium text-zinc-500">Mots-cles (virgules)</label>
        <input
          name="keywords"
          defaultValue={keywords}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="text-xs font-medium text-zinc-500">Texte brut</label>
        <textarea
          name="rawText"
          defaultValue={job.rawText}
          rows={8}
          className="rounded-md border border-zinc-300 px-3 py-2 font-mono text-xs"
        />
        <div>
          <SubmitButton pendingLabel="Enregistrement...">Enregistrer les champs</SubmitButton>
        </div>
      </form>
    </div>
  );
}
