"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markdownToCv } from "@/lib/cv/markdown";
import { cvSchema, extractedJobSchema, PROMPT_VERSION } from "@/lib/cv/schema";
import { sanitizeAdaptedCv } from "@/lib/cv/sanitize";
import {
  createJob,
  getJob,
  insertAdaptedCv,
  parseMasterCvJson,
  saveMasterCvRow,
  updateJob,
} from "@/lib/db/queries";
import { fetchJobPage } from "@/lib/fetch-job";
import { adaptCvWithGemini, extractJobWithGemini, geminiModel } from "@/lib/gemini";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createJobFromUrlAction(formData: FormData) {
  const url = formString(formData, "url");
  if (!url) throw new Error("URL requise");

  const row = createJob({
    url,
    rawText: "",
    status: "pending",
    createdAt: Date.now(),
  });

  try {
    const page = await fetchJobPage(url);
    try {
      const extracted = await extractJobWithGemini(page.text);
      updateJob(row.id, {
        url: page.finalUrl,
        rawText: page.text,
        title: extracted.title,
        company: extracted.company,
        location: extracted.location,
        contract: extracted.contract,
        requirementsJson: JSON.stringify(extracted.requirements),
        keywordsJson: JSON.stringify(extracted.keywords),
        status: "fetched",
        error: null,
        fetchedAt: Date.now(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Echec de l'extraction";
      updateJob(row.id, {
        url: page.finalUrl,
        rawText: page.text,
        status: "failed",
        error: message,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Echec du fetch";
    updateJob(row.id, {
      status: "failed",
      error: message,
    });
  }

  revalidatePath("/");
  redirect(`/jobs/${row.id}`);
}

export async function createJobFromTextAction(formData: FormData) {
  const rawText = formString(formData, "rawText");
  const url = formString(formData, "url") || null;
  if (rawText.length < 40) throw new Error("Colle un texte d'offre plus long");

  const row = createJob({
    url,
    rawText,
    status: "pending",
    createdAt: Date.now(),
  });

  try {
    const extracted = await extractJobWithGemini(rawText);
    updateJob(row.id, {
      title: extracted.title,
      company: extracted.company,
      location: extracted.location,
      contract: extracted.contract,
      requirementsJson: JSON.stringify(extracted.requirements),
      keywordsJson: JSON.stringify(extracted.keywords),
      status: "fetched",
      error: null,
      fetchedAt: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Echec de l'extraction";
    updateJob(row.id, { status: "failed", error: message });
  }

  revalidatePath("/");
  redirect(`/jobs/${row.id}`);
}

export async function saveJobDetailsAction(jobId: number, formData: FormData) {
  const rawText = formString(formData, "rawText");
  updateJob(jobId, {
    title: formString(formData, "title"),
    company: formString(formData, "company"),
    location: formString(formData, "location"),
    contract: formString(formData, "contract"),
    rawText,
    requirementsJson: JSON.stringify(
      formString(formData, "requirements")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    ),
    keywordsJson: JSON.stringify(
      formString(formData, "keywords")
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
    ),
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function retryExtractFromPastedTextAction(jobId: number, formData: FormData) {
  const rawText = formString(formData, "rawText");
  if (rawText.length < 40) throw new Error("Texte trop court");

  updateJob(jobId, { rawText, status: "pending", error: null });
  try {
    const extracted = await extractJobWithGemini(rawText);
    updateJob(jobId, {
      title: extracted.title,
      company: extracted.company,
      location: extracted.location,
      contract: extracted.contract,
      requirementsJson: JSON.stringify(extracted.requirements),
      keywordsJson: JSON.stringify(extracted.keywords),
      status: "fetched",
      error: null,
      fetchedAt: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Echec de l'extraction";
    updateJob(jobId, { status: "failed", error: message });
  }
  revalidatePath(`/jobs/${jobId}`);
}

export async function saveMasterCvAction(formData: FormData) {
  const markdown = String(formData.get("markdown") ?? "");
  const parsed = cvSchema.parse(markdownToCv(markdown));
  saveMasterCvRow(markdown, parsed);
  revalidatePath("/cv");
}

export async function adaptJobAction(jobId: number) {
  const job = getJob(jobId);
  if (!job) throw new Error("Offre introuvable");
  const master = parseMasterCvJson();

  updateJob(jobId, { status: "adapting", error: null });
  revalidatePath(`/jobs/${jobId}`);

  try {
    const extracted = extractedJobSchema.parse({
      title: job.title,
      company: job.company,
      location: job.location,
      contract: job.contract,
      requirements: JSON.parse(job.requirementsJson),
      keywords: JSON.parse(job.keywordsJson),
    });
    const adapted = sanitizeAdaptedCv(
      master,
      await adaptCvWithGemini(master, extracted),
    );
    insertAdaptedCv({
      jobId,
      cvJson: JSON.stringify(adapted),
      model: geminiModel(),
      promptVersion: PROMPT_VERSION,
      createdAt: Date.now(),
    });
    updateJob(jobId, { status: "adapted", error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Adaptation echouee";
    updateJob(jobId, { status: "failed", error: message });
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/jobs/${jobId}/preview`);
}

export async function markDownloadedAction(jobId: number) {
  updateJob(jobId, { status: "downloaded" });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/");
}
