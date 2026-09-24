import { adaptJobAction } from "@/actions/jobs";
import { SubmitButton } from "./SubmitButton";

export function AdaptButton({ jobId }: { jobId: number }) {
  return (
    <form action={adaptJobAction.bind(null, jobId)}>
      <SubmitButton pendingLabel="Adaptation Gemini...">Adapter le CV</SubmitButton>
    </form>
  );
}
