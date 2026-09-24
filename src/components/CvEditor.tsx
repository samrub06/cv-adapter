import { saveMasterCvAction } from "@/actions/jobs";
import { SubmitButton } from "./SubmitButton";

export function CvEditor({ markdown }: { markdown: string }) {
  return (
    <form action={saveMasterCvAction} className="space-y-3">
      <textarea
        name="markdown"
        defaultValue={markdown}
        rows={28}
        className="w-full rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm"
      />
      <SubmitButton pendingLabel="Enregistrement...">Enregistrer le CV maitre</SubmitButton>
    </form>
  );
}
