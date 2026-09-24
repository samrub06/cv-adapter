import { draftOutreachAction, sendOutreachAction } from "@/actions/outreach";
import { brevoConfigured } from "@/lib/brevo";
import { companyHookSchema } from "@/lib/cv/schema";
import type { OutreachRow } from "@/lib/db/queries";
import { SubmitButton } from "./SubmitButton";

export function OutreachForm({
  jobId,
  company,
  latest,
}: {
  jobId: number;
  company: string;
  latest: OutreachRow | undefined;
}) {
  let hookData = null;
  if (latest?.hookJson) {
    try {
      const parsed = companyHookSchema.safeParse(JSON.parse(latest.hookJson));
      if (parsed.success) hookData = parsed.data;
    } catch {
      hookData = null;
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold">Premier mail Talent Acquisition</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gemini cherche une news / un produit chez {company || "l'entreprise"}, puis rédige un
          premier mail court (pas un dump de CV). Relis avant d&apos;envoyer via Brevo.
        </p>
        {!brevoConfigured() ? (
          <p className="mt-2 text-sm text-amber-800">
            Envoi désactivé : ajoute <code>BREVO_API_KEY</code> et{" "}
            <code>BREVO_SENDER_EMAIL</code> (expéditeur vérifié dans Brevo) dans{" "}
            <code>.env.local</code>.
          </p>
        ) : null}
      </div>

      <form action={draftOutreachAction.bind(null, jobId)} className="grid gap-3 md:grid-cols-2">
        <input
          name="recruiterName"
          required
          defaultValue={latest?.recruiterName}
          placeholder="Nom du recruteur"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="recruiterEmail"
          type="email"
          required
          defaultValue={latest?.recruiterEmail}
          placeholder="email.ta@entreprise.com"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="md:col-span-2">
          <SubmitButton pendingLabel="Recherche + brouillon...">
            Generer le meilleur premier mail
          </SubmitButton>
        </div>
      </form>

      {hookData ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <p className="font-medium">
            Hook : {hookData.hookType}
            {hookData.confidence !== "high" ? ` · confiance ${hookData.confidence}` : ""}
          </p>
          <p className="mt-1 text-zinc-700">{hookData.hook}</p>
          {hookData.sourceUrl ? (
            <a
              href={hookData.sourceUrl}
              className="mt-1 inline-block text-xs underline"
              target="_blank"
              rel="noreferrer"
            >
              {hookData.sourceTitle || hookData.sourceUrl}
            </a>
          ) : null}
          {hookData.confidence === "low" || hookData.hookType === "none" ? (
            <p className="mt-2 text-xs text-zinc-500">
              Pas de news solide : le mail ouvre sur le rôle, sans fake news.
            </p>
          ) : null}
        </div>
      ) : null}

      {latest ? (
        <form action={sendOutreachAction.bind(null, jobId)} className="grid gap-3">
          <input type="hidden" name="recruiterName" defaultValue={latest.recruiterName} />
          <input type="hidden" name="recruiterEmail" defaultValue={latest.recruiterEmail} />
          <input
            name="subject"
            defaultValue={latest.subject}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium"
          />
          <textarea
            name="body"
            defaultValue={latest.body}
            rows={14}
            className="rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingLabel="Envoi Brevo...">Envoyer via Brevo</SubmitButton>
            <p className="text-xs text-zinc-500">
              {latest.status === "sent" && latest.sentAt
                ? `Envoye le ${new Date(latest.sentAt).toLocaleString("fr-FR")}`
                : latest.status === "failed"
                  ? `Echec : ${latest.error}`
                  : "Premier contact : pas de piece jointe (meilleur deliverability)."}
            </p>
          </div>
        </form>
      ) : null}
    </section>
  );
}
