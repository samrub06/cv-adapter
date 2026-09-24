import { desc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { adaptedCvs, jobs, masterCv, outreachEmails } from "./schema";
import { cvSchema, type Cv, type JobStatus } from "@/lib/cv/schema";

export type JobRow = typeof jobs.$inferSelect;

export function listJobs() {
  return getDb().select().from(jobs).orderBy(desc(jobs.createdAt)).all();
}

export function getJob(id: number) {
  return getDb().select().from(jobs).where(eq(jobs.id, id)).get();
}

export function createJob(values: typeof jobs.$inferInsert) {
  const result = getDb().insert(jobs).values(values).returning().get();
  return result;
}

export function updateJob(id: number, values: Partial<typeof jobs.$inferInsert>) {
  return getDb().update(jobs).set(values).where(eq(jobs.id, id)).returning().get();
}

export function getMasterCv() {
  return getDb().select().from(masterCv).where(eq(masterCv.id, 1)).get();
}

export function saveMasterCvRow(markdown: string, parsed: Cv) {
  return getDb()
    .update(masterCv)
    .set({
      markdown,
      parsedJson: JSON.stringify(parsed),
      updatedAt: Date.now(),
    })
    .where(eq(masterCv.id, 1))
    .returning()
    .get();
}

export function parseMasterCvJson(): Cv {
  const row = getMasterCv();
  if (!row) throw new Error("CV maitre manquant");
  return cvSchema.parse(JSON.parse(row.parsedJson));
}

export function latestAdaptedCv(jobId: number) {
  return getDb()
    .select()
    .from(adaptedCvs)
    .where(eq(adaptedCvs.jobId, jobId))
    .orderBy(desc(adaptedCvs.createdAt))
    .get();
}

export function insertAdaptedCv(values: typeof adaptedCvs.$inferInsert) {
  return getDb().insert(adaptedCvs).values(values).returning().get();
}

export type OutreachRow = typeof outreachEmails.$inferSelect;

export function latestOutreach(jobId: number) {
  return getDb()
    .select()
    .from(outreachEmails)
    .where(eq(outreachEmails.jobId, jobId))
    .orderBy(desc(outreachEmails.createdAt))
    .get();
}

export function insertOutreach(values: typeof outreachEmails.$inferInsert) {
  return getDb().insert(outreachEmails).values(values).returning().get();
}

export function updateOutreach(
  id: number,
  values: Partial<typeof outreachEmails.$inferInsert>,
) {
  return getDb()
    .update(outreachEmails)
    .set(values)
    .where(eq(outreachEmails.id, id))
    .returning()
    .get();
}

export function jobRequirements(job: JobRow): string[] {
  try {
    return JSON.parse(job.requirementsJson) as string[];
  } catch {
    return [];
  }
}

export function jobKeywords(job: JobRow): string[] {
  try {
    return JSON.parse(job.keywordsJson) as string[];
  } catch {
    return [];
  }
}

export function isJobStatus(value: string): value is JobStatus {
  return [
    "pending",
    "fetched",
    "failed",
    "adapting",
    "adapted",
    "downloaded",
  ].includes(value);
}
