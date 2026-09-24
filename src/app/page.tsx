import Link from "next/link";
import { JobCreateForms } from "@/components/JobCreateForms";
import { StatusBadge } from "@/components/StatusBadge";
import { listJobs } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const jobs = listJobs();

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Offres</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Ajoute une URL. Si le scrape echoue, colle le texte — surtout LinkedIn.
        </p>
      </div>

      <JobCreateForms />

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Offre</th>
              <th className="px-4 py-3">Entreprise</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-zinc-500" colSpan={4}>
                  Aucune offre pour l&apos;instant.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    <Link href={`/jobs/${job.id}`} className="font-medium hover:underline">
                      {job.title || job.url || `Offre #${job.id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{job.company || "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(job.createdAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
