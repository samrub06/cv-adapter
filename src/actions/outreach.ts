"use server";

import { revalidatePath } from "next/cache";
import { brevoConfigured, sendBrevoEmail } from "@/lib/brevo";
import { draftOutreachEmail, researchCompanyHook } from "@/lib/gemini";
import {
  getJob,
  insertOutreach,
  latestOutreach,
  parseMasterCvJson,
  updateOutreach,
} from "@/lib/db/queries";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function draftOutreachAction(jobId: number, formData: FormData) {
  const job = getJob(jobId);
  if (!job) throw new Error("Offre introuvable");

  const recruiterName = formString(formData, "recruiterName");
  const recruiterEmail = formString(formData, "recruiterEmail");
  if (!recruiterName) throw new Error("Nom du recruteur requis");
  if (!recruiterEmail.includes("@")) throw new Error("Email recruteur invalide");
  if (!job.company) throw new Error("Renseigne l'entreprise sur l'offre d'abord");

  const candidate = parseMasterCvJson();
  const research = await researchCompanyHook({
    company: job.company,
    recruiterName,
    jobTitle: job.title,
  });
  const draft = await draftOutreachEmail({
    recruiterName,
    company: job.company,
    jobTitle: job.title,
    jobLocation: job.location,
    research,
    candidate,
  });

  insertOutreach({
    jobId,
    recruiterName,
    recruiterEmail,
    hookJson: JSON.stringify(draft.hook),
    subject: draft.subject,
    body: draft.body,
    status: "draft",
    createdAt: Date.now(),
  });

  revalidatePath(`/jobs/${jobId}`);
}

export async function sendOutreachAction(jobId: number, formData: FormData) {
  if (!brevoConfigured()) {
    throw new Error("Configure BREVO_API_KEY et BREVO_SENDER_EMAIL dans .env.local");
  }

  const job = getJob(jobId);
  const latest = latestOutreach(jobId);
  if (!job || !latest) throw new Error("Brouillon introuvable");

  const recruiterName = formString(formData, "recruiterName") || latest.recruiterName;
  const recruiterEmail = formString(formData, "recruiterEmail") || latest.recruiterEmail;
  const subject = formString(formData, "subject");
  const body = formString(formData, "body");
  if (!recruiterEmail.includes("@")) throw new Error("Email recruteur invalide");
  if (!subject || body.length < 40) throw new Error("Sujet et corps requis");

  try {
    const messageId = await sendBrevoEmail({
      toEmail: recruiterEmail,
      toName: recruiterName,
      subject,
      text: body,
    });
    updateOutreach(latest.id, {
      recruiterName,
      recruiterEmail,
      subject,
      body,
      status: "sent",
      brevoMessageId: messageId,
      error: null,
      sentAt: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Envoi Brevo echoue";
    updateOutreach(latest.id, { status: "failed", error: message });
    throw error;
  }

  revalidatePath(`/jobs/${jobId}`);
}
