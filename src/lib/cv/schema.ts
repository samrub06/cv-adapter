import { z } from "zod";

export const identitySchema = z.object({
  name: z.string(),
  title: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  links: z.array(z.string()),
});

export const skillGroupSchema = z.object({
  name: z.string(),
  items: z.array(z.string()),
});

export const experienceSchema = z.object({
  company: z.string(),
  companyDetail: z.string().default(""),
  role: z.string(),
  location: z.string().default(""),
  start: z.string(),
  end: z.string(),
  bullets: z.array(z.string()),
});

export const projectSchema = z.object({
  name: z.string(),
  detail: z.string().default(""),
  bullets: z.array(z.string()),
});

export const educationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  year: z.string(),
});

export const languageSchema = z.object({
  name: z.string(),
  level: z.string(),
});

export const cvSchema = z.object({
  identity: identitySchema,
  highlights: z.array(z.string()).default([]),
  summary: z.string(),
  experiences: z.array(experienceSchema),
  skillGroups: z.array(skillGroupSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(projectSchema).default([]),
  education: z.array(educationSchema),
  languages: z.array(languageSchema),
});

export type Cv = z.infer<typeof cvSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Project = z.infer<typeof projectSchema>;

export const extractedJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string(),
  contract: z.string(),
  requirements: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type ExtractedJob = z.infer<typeof extractedJobSchema>;

export const emptyCv = (): Cv => ({
  identity: {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    links: [],
  },
  highlights: [],
  summary: "",
  experiences: [],
  skillGroups: [],
  skills: [],
  projects: [],
  education: [],
  languages: [],
});

export function flatSkills(cv: Pick<Cv, "skills" | "skillGroups">): string[] {
  if (cv.skillGroups.length > 0) {
    return cv.skillGroups.flatMap((group) => group.items);
  }
  return cv.skills;
}

export const JOB_STATUSES = [
  "pending",
  "fetched",
  "failed",
  "adapting",
  "adapted",
  "downloaded",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const PROMPT_VERSION = "v3";

export const companyHookSchema = z.object({
  hookType: z.enum(["news", "product", "hiring", "none"]),
  hook: z.string(),
  sourceUrl: z.string(),
  sourceTitle: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type CompanyHook = z.infer<typeof companyHookSchema>;

export const outreachDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  language: z.string(),
  hook: companyHookSchema,
});

export type OutreachDraft = z.infer<typeof outreachDraftSchema>;
