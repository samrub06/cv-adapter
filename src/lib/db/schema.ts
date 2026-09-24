import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url"),
  rawText: text("raw_text").notNull().default(""),
  title: text("title").notNull().default(""),
  company: text("company").notNull().default(""),
  location: text("location").notNull().default(""),
  contract: text("contract").notNull().default(""),
  requirementsJson: text("requirements_json").notNull().default("[]"),
  keywordsJson: text("keywords_json").notNull().default("[]"),
  status: text("status").notNull().default("pending"),
  error: text("error"),
  fetchedAt: integer("fetched_at"),
  createdAt: integer("created_at").notNull(),
});

export const masterCv = sqliteTable("master_cv", {
  id: integer("id").primaryKey(),
  markdown: text("markdown").notNull(),
  parsedJson: text("parsed_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const adaptedCvs = sqliteTable("adapted_cvs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  cvJson: text("cv_json").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const outreachEmails = sqliteTable("outreach_emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("job_id")
    .notNull()
    .references(() => jobs.id),
  recruiterName: text("recruiter_name").notNull().default(""),
  recruiterEmail: text("recruiter_email").notNull().default(""),
  hookJson: text("hook_json").notNull().default("{}"),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("draft"),
  brevoMessageId: text("brevo_message_id"),
  error: text("error"),
  createdAt: integer("created_at").notNull(),
  sentAt: integer("sent_at"),
});
