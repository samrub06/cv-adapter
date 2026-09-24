import { GoogleGenAI } from "@google/genai";
import {
  cvSchema,
  extractedJobSchema,
  outreachDraftSchema,
  type Cv,
  type ExtractedJob,
  type OutreachDraft,
} from "@/lib/cv/schema";

const extractedJobJsonSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    company: { type: "string" },
    location: { type: "string" },
    contract: { type: "string" },
    requirements: { type: "array", items: { type: "string" } },
    keywords: { type: "array", items: { type: "string" } },
  },
  required: ["title", "company", "location", "contract", "requirements", "keywords"],
};

const cvJsonSchema = {
  type: "object",
  properties: {
    identity: {
      type: "object",
      properties: {
        name: { type: "string" },
        title: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        links: { type: "array", items: { type: "string" } },
      },
      required: ["name", "title", "email", "phone", "location", "links"],
    },
    highlights: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    experiences: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          companyDetail: { type: "string" },
          role: { type: "string" },
          location: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: [
          "company",
          "companyDetail",
          "role",
          "location",
          "start",
          "end",
          "bullets",
        ],
      },
    },
    skillGroups: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          items: { type: "array", items: { type: "string" } },
        },
        required: ["name", "items"],
      },
    },
    skills: { type: "array", items: { type: "string" } },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          detail: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
        required: ["name", "detail", "bullets"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: "string" },
          degree: { type: "string" },
          year: { type: "string" },
        },
        required: ["school", "degree", "year"],
      },
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: { type: "string" },
        },
        required: ["name", "level"],
      },
    },
  },
  required: [
    "identity",
    "highlights",
    "summary",
    "experiences",
    "skillGroups",
    "skills",
    "projects",
    "education",
    "languages",
  ],
};

function client() {
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY manquante dans .env.local");
  }
  return new GoogleGenAI({ apiKey });
}

export function geminiModel() {
  return process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
}

async function generateJson<T>(
  prompt: string,
  jsonSchema: object,
  temperature: number,
  parse: (value: unknown) => T,
): Promise<T> {
  const ai = client();
  const model = geminiModel();
  const run = async () => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
      },
    });
    const text = response.text;
    if (!text) throw new Error("Reponse Gemini vide");
    return parse(JSON.parse(text));
  };

  try {
    return await run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("404") || message.includes("NOT_FOUND")) throw error;
    return await run();
  }
}

export async function extractJobWithGemini(rawText: string): Promise<ExtractedJob> {
  const prompt = `Extract structured job posting fields from this listing.
Use the listing language. If a field is unknown, use an empty string or empty array.
Do not invent a company name if it is not present.

LISTING:
${rawText.slice(0, 20_000)}`;

  return generateJson(prompt, extractedJobJsonSchema, 0.1, (json) =>
    extractedJobSchema.parse(json),
  );
}

export async function adaptCvWithGemini(master: Cv, job: ExtractedJob): Promise<Cv> {
  const prompt = `Adapt this resume for the job while keeping the same one-page ATS template.
The page must look FULL, not sparse. White space is a failure. Do not pad with blank lines.

Density rules:
- Keep EVERY master experience, project, skill group, education item, and language.
- Missions/bullets must be richer than a thin rewrite. Recent two roles: 5-6 bullets each. Older roles: 3-5 bullets. Projects: 2-3 bullets.
- Each bullet should be a packed sentence (tools, system, scope, outcome) using ONLY facts already in the master CV. Weave in job ATS keywords where they match real work.
- You may split a dense master bullet into two bullets, or merge overlapping ones, if that fills the page better. Never invent employers, dates, metrics, users, or skills.
- Summary: 4-5 sentences, one paragraph, no line breaks, covering stack + scale + the job's focus.
- Keep all skill groups. Reorder groups/items toward the job; do not empty a group.
- Keep companyDetail, job location, highlights, education, and languages identical to the master CV.
- Keep identity contact fields identical. You may tweak the professional title toward the job.
- Output language must match the job listing language.
- Hard limit: still one page. Prefer denser bullets over dropping sections.

MASTER CV JSON:
${JSON.stringify(master)}

JOB JSON:
${JSON.stringify(job)}`;

  return generateJson(prompt, cvJsonSchema, 0.2, (json) => cvSchema.parse(json));
}

const companyHookJsonSchema = {
  type: "object",
  properties: {
    hookType: { type: "string", enum: ["news", "product", "hiring", "none"] },
    hook: { type: "string" },
    sourceUrl: { type: "string" },
    sourceTitle: { type: "string" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["hookType", "hook", "sourceUrl", "sourceTitle", "confidence"],
};

const outreachDraftJsonSchema = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    language: { type: "string" },
    hook: companyHookJsonSchema,
  },
  required: ["subject", "body", "language", "hook"],
};

export async function researchCompanyHook(input: {
  company: string;
  recruiterName: string;
  jobTitle: string;
}): Promise<string> {
  const ai = client();
  const prompt = `Search the public web for the most recent, verifiable facts about this company that a software engineer could mention in a first email to Talent Acquisition.

Company: ${input.company}
Role: ${input.jobTitle || "unknown"}
Recruiter name (do not invent a biography): ${input.recruiterName || "unknown"}

Prefer, in order:
1) News from the last 12 months (funding, product launch, expansion, acquisition)
2) A current product / platform the company is clearly shipping
3) A public hiring or engineering-blog signal

Rules:
- Only state facts you can ground in search results.
- If nothing reliable, say so explicitly.
- Return 4-8 short bullets: fact + source URL.`;

  const run = async () => {
    const response = await ai.models.generateContent({
      model: geminiModel(),
      contents: prompt,
      config: {
        temperature: 0.2,
        tools: [{ googleSearch: {} }],
      },
    });
    const text = response.text?.trim();
    if (!text) throw new Error("Recherche Gemini vide");
    return text;
  };

  try {
    return await run();
  } catch {
    const fallback = await ai.models.generateContent({
      model: geminiModel(),
      contents: prompt,
      config: { temperature: 0.2 },
    });
    const text = fallback.text?.trim();
    if (!text) throw new Error("Recherche Gemini vide");
    return text;
  }
}

export async function draftOutreachEmail(input: {
  recruiterName: string;
  company: string;
  jobTitle: string;
  jobLocation: string;
  research: string;
  candidate: Cv;
}): Promise<OutreachDraft> {
  const firstName = input.recruiterName.split(/\s+/)[0] ?? "";
  const recent = input.candidate.experiences.slice(0, 2);
  const links = input.candidate.identity.links.join(" | ");

  const prompt = `Write a first-touch email from a candidate to a Talent Acquisition / recruiter.

This is NOT a mass cold-sales email. Best practices you MUST follow:
- 80 to 130 words. One screen. No "I hope this email finds you well".
- Subject: 5-9 words, specific. Include company or role signal. No "Opportunity", "Quick question", "Following up", "Excited to apply".
- Line 1: a concrete hook from RESEARCH (news, product, or hiring signal). If research is weak or none, do not fake news — open on the role itself.
- Line 2-3: why this person for THIS role. Max two proof points from the candidate CV (stack, scale, systems). No CV dump.
- Close: one soft CTA (15 min chat / if helpful I can send the tailored CV). No attachment mention as already attached.
- Sign-off: name, title, city, email, phone, 1-2 links.
- Use the recruiter first name if it looks like a real given name.
- Match the likely language of the company/job (Hebrew companies in Israel often still use English for engineering). Default English unless the job is clearly French.
- Never invent news, metrics, or that you already spoke.

RECRUITER: ${input.recruiterName} (first name guess: ${firstName})
COMPANY: ${input.company}
ROLE: ${input.jobTitle}
LOCATION: ${input.jobLocation}

RESEARCH NOTES (may contain sources):
${input.research.slice(0, 12_000)}

CANDIDATE:
Name: ${input.candidate.identity.name}
Title: ${input.candidate.identity.title}
Email: ${input.candidate.identity.email}
Phone: ${input.candidate.identity.phone}
Location: ${input.candidate.identity.location}
Links: ${links}
Highlights: ${input.candidate.highlights.join(" · ")}
Recent experience JSON:
${JSON.stringify(recent)}`;

  return generateJson(prompt, outreachDraftJsonSchema, 0.35, (json) =>
    outreachDraftSchema.parse(json),
  );
}
