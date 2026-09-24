import {
  createJobFromTextAction,
  createJobFromUrlAction,
} from "@/actions/jobs";
import { SubmitButton } from "./SubmitButton";

export function JobCreateForms() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form
        action={createJobFromUrlAction}
        className="rounded-xl border border-zinc-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold">Ajouter une URL</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Si LinkedIn / Indeed bloquent, le job passera en failed — colle alors le texte.
        </p>
        <input
          name="url"
          type="url"
          required
          placeholder="https://..."
          className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="mt-3">
          <SubmitButton pendingLabel="Recuperation...">Fetcher l&apos;offre</SubmitButton>
        </div>
      </form>

      <form
        action={createJobFromTextAction}
        className="rounded-xl border border-zinc-200 bg-white p-4"
      >
        <h2 className="text-sm font-semibold">Coller le texte de l&apos;offre</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Chemin nominal pour LinkedIn. URL optionnelle, juste pour l&apos;historique.
        </p>
        <input
          name="url"
          type="url"
          placeholder="URL (optionnelle)"
          className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <textarea
          name="rawText"
          required
          rows={6}
          placeholder="Colle l'annonce ici"
          className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="mt-3">
          <SubmitButton pendingLabel="Extraction...">Parser le texte</SubmitButton>
        </div>
      </form>
    </div>
  );
}
