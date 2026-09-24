import { emptyCv, flatSkills, type Cv } from "./schema";

export const DEFAULT_CV_MARKDOWN = `# SAMUEL CHARBIT
Senior Software Engineer | Full Stack · Distributed Systems · AI
Tel Aviv, Israel | +972-58-404-6422 | samrub06@gmail.com | https://linkedin.com/in/samuelcharbit | https://github.com/samrub06 | https://samuelcharbit.vercel.app
5+ yrs experience · 200 → 5,000+ users scaled · 100+ simulations/week processed · 2 engineers mentored

## Summary
Senior Software Engineer with 5+ years building scalable SaaS platforms, AI-powered systems, and distributed architectures. Deep experience across React/TypeScript, Node.js, PostgreSQL/MongoDB, and cloud-native systems on AWS, Azure, and Google Cloud. Track record of owning system architecture end-to-end, scaling production platforms to thousands of concurrent users, and mentoring engineers. Comfortable moving between real-time AI/streaming systems, distributed job processing, and enterprise front-end applications.

## Technical Skills
Frontend: React, Next.js, TypeScript, Redux Toolkit, React Query, Tailwind CSS, shadcn/ui, MUI, D3.js
Backend: Node.js, Express, NestJS, REST APIs, WebSockets, Python
Distributed & Messaging: RabbitMQ, Redis, Worker Queues, Event-Driven Architecture, Distributed Systems
Cloud & DevOps: Google Cloud Platform (Cloud Run, Load Balancing, VPN, Cloud Triggers), Microsoft Azure (STT/TTS, Cognitive Services), AWS (EC2, S3, Auto Scaling), Docker, CI/CD, Vercel
Databases: PostgreSQL, MongoDB, Supabase
AI & Real-Time: Gemini LLM, ElevenLabs, Speech-to-Text/Text-to-Speech, OCR, LLM Integration, Low-Latency Streaming

## Experience

### Edventure.il (EdTech, AI tutoring platform, Israel & US markets)
Senior Fullstack Developer | Herzliya, Israel
Oct 2025 – Present
- Owned end-to-end delivery of an AI tutoring platform (Edwin): personalized classroom sessions with a real-time 3D avatar, multimodal dialogue, and live teacher visibility.
- Designed the conversational stack: Azure STT, LLM-driven pedagogical responses, dual TTS (ElevenLabs audio + Azure visemes), and frame-accurate lip-sync on Three.js GLB avatars.
- Migrated production workloads from Microsoft Azure to Google Cloud (Cloud Run, global Load Balancing, VPN, event-driven Cloud Triggers), improving deployment velocity and network isolation while keeping low-latency AI voice sessions.
- Hardened the platform for education-sector use with SOC 2 / ISO 27001-aligned controls, encrypted data paths, and enterprise-grade security posture.
- Scaled the platform from 200 to 5,000+ registered users across schools; mentored 2 engineers alongside the CTO on architecture decisions.

### DesignBuilder Software (Building energy-performance simulation software, Israel)
Full-Stack Developer | Tel Aviv, Israel
Jan 2024 – Oct 2025
- Designed and operated a distributed job pipeline (dispatcher + Windows workers) for EnergyPlus/EPC simulations: MongoDB-backed queue, pull-based dispatch, retries/timeouts, and AWS Auto Scaling of worker capacity.
- Built a Three.js 3D building viewer (IDF geometry) with inspection tooling (zones, envelope, SHGC/solar), embedded in a React product via feature-flagged org access.
- Owned the full-stack energy compliance platform (React/TypeScript + Node/Express + MongoDB): revisions lifecycle, results packaging (S3/Drive), PDF validation reports, and admin job-queue monitoring.
- Integrated external EPC CLI simulators into workers (input prep, run, parse/collect, completion), with multi-version routing and Amazon vs on-prem worker affinity.
- Delivered product features end-to-end: multi-tenant orgs, permissions, revision compare/analysis views, and operational hardening (cron roles, maintenance mode, worker auth).

### Veepee (One of Europe's largest e-commerce platforms)
Full-Stack Developer | Tel Aviv, Israel
Jan 2021 – Jan 2024
- Built React/TypeScript BackOffice tools for supply-chain and merchandising operations (SRM, InFlow lifecycle) used by 1,000+ internal users.
- Implemented frontend architecture with Redux Toolkit and React Query; improved performance via code splitting and lazy loading.
- Integrated Node.js + PostgreSQL REST APIs and added monitoring via Sentry.

## Projects

### Tabasco: Music Platform (tabascomusic.com)
- Built and shipped a web platform for musicians to discover, read, transpose and organize sheet music and guitar tabs, from scratch to production on Vercel.
- Stack: Next.js, TypeScript, Supabase, PostgreSQL, Tailwind CSS, shadcn/ui; mobile-first, ad-free UX with chord transposition and a responsive music viewer.

## Education
Full-Stack Coding Bootcamp, Israel Tech Challenge (ITC), Tel Aviv (2020 – 2021)
Master's Degree, Marketing & Data Analytics, NEOMA Business School, France (2017 – 2022)

## Languages
French: Native
English: Native/Bilingual
Hebrew: Full Professional
Spanish: Professional Working
`;

function splitHeaderContacts(line: string) {
  return line
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function looksLikeDates(line: string) {
  return /\d/.test(line) && /[–-]/.test(line);
}

function parseCompanyHeading(heading: string) {
  const match = heading.match(/^(.+?)\s+\((.+)\)\s*$/);
  if (match) {
    return { company: match[1].trim(), companyDetail: match[2].trim() };
  }
  return { company: heading.trim(), companyDetail: "" };
}

export function markdownToCv(markdown: string): Cv {
  const cv = emptyCv();
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const sections: { heading: string; body: string[] }[] = [];
  let current = { heading: "__header__", body: [] as string[] };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)\s*$/);
    if (match) {
      sections.push(current);
      current = { heading: match[1].trim().toLowerCase(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);

  const header = sections.find((s) => s.heading === "__header__")?.body ?? [];
  const headerContent = header.map((l) => l.trim()).filter(Boolean);
  for (const line of headerContent) {
    if (line.startsWith("# ")) {
      cv.identity.name = line.slice(2).trim();
    } else if (!cv.identity.title) {
      cv.identity.title = line;
    } else if (line.includes("·") && !line.includes("@") && !line.startsWith("http")) {
      cv.highlights = line
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean);
    } else if (line.includes("|") || line.includes("@") || line.startsWith("+")) {
      const parts = splitHeaderContacts(line);
      for (const part of parts) {
        if (part.includes("@") && !cv.identity.email) cv.identity.email = part;
        else if (/^[+\d]/.test(part) && !cv.identity.phone) cv.identity.phone = part;
        else if (part.startsWith("http") || part.includes("linkedin.com") || part.includes("github.com")) {
          cv.identity.links.push(part.startsWith("http") ? part : `https://${part}`);
        } else if (!cv.identity.location) cv.identity.location = part;
      }
    } else if (line.startsWith("http")) {
      cv.identity.links.push(line);
    }
  }

  for (const section of sections) {
    if (section.heading === "__header__") continue;
    if (section.heading.startsWith("summary")) {
      cv.summary = section.body.join(" ").replace(/\s+/g, " ").trim();
    } else if (section.heading.startsWith("highlight")) {
      cv.highlights = section.body
        .join(" ")
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (section.heading.includes("skill")) {
      const groups = parseSkillGroups(section.body);
      cv.skillGroups = groups;
      cv.skills = groups.flatMap((group) => group.items);
    } else if (section.heading.includes("project")) {
      cv.projects = parseProjects(section.body);
    } else if (section.heading.startsWith("experience")) {
      cv.experiences = parseExperiences(section.body);
    } else if (section.heading.startsWith("education")) {
      cv.education = parseEducation(section.body);
    } else if (section.heading.startsWith("language")) {
      cv.languages = section.body
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          const [name, level] = l.split(":").map((p) => p.trim());
          return { name: name ?? "", level: level ?? "" };
        });
    }
  }

  return cv;
}

function parseSkillGroups(body: string[]): Cv["skillGroups"] {
  const groups: Cv["skillGroups"] = [];
  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx > 0) {
      groups.push({
        name: line.slice(0, idx).trim(),
        items: line
          .slice(idx + 1)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } else {
      groups.push({
        name: "",
        items: line
          .split(/[,;]/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
    }
  }
  return groups;
}

function parseExperiences(body: string[]): Cv["experiences"] {
  const experiences: Cv["experiences"] = [];
  let current: Cv["experiences"][number] | null = null;

  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^###\s+(.+)$/);
    if (heading) {
      if (current) experiences.push(current);
      const parsed = parseCompanyHeading(heading[1]);
      current = {
        role: "",
        company: parsed.company,
        companyDetail: parsed.companyDetail,
        location: "",
        start: "",
        end: "",
        bullets: [],
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("- ")) {
      current.bullets.push(line.slice(2).trim());
      continue;
    }
    if (looksLikeDates(line)) {
      const dates = line.match(/^(\S.*?)\s+[–-]\s+(\S.*)$/);
      if (dates) {
        current.start = dates[1].trim();
        current.end = dates[2].trim();
        continue;
      }
    }
    if (line.includes("|")) {
      const [role, location] = line.split("|").map((p) => p.trim());
      current.role = role ?? "";
      current.location = location ?? "";
      continue;
    }
    if (!current.role) current.role = line;
  }
  if (current) experiences.push(current);
  return experiences;
}

function parseProjects(body: string[]): Cv["projects"] {
  const projects: Cv["projects"] = [];
  let current: Cv["projects"][number] | null = null;

  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^###\s+(.+)$/);
    if (heading) {
      if (current) projects.push(current);
      const parsed = parseCompanyHeading(heading[1]);
      current = {
        name: parsed.company,
        detail: parsed.companyDetail,
        bullets: [],
      };
      continue;
    }
    if (current && line.startsWith("- ")) {
      current.bullets.push(line.slice(2).trim());
    }
  }
  if (current) projects.push(current);
  return projects;
}

function parseEducation(body: string[]): Cv["education"] {
  const education: Cv["education"] = [];
  let pending: { school: string; degree: string; year: string } | null = null;

  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(/^###\s+(.+?)\s+—\s+(.+)$/);
    if (heading) {
      if (pending) education.push(pending);
      pending = {
        degree: heading[1].trim(),
        school: heading[2].trim(),
        year: "",
      };
      continue;
    }
    if (pending && !pending.year && !line.startsWith("- ")) {
      pending.year = line.replace(/^- /, "");
      continue;
    }
    const withYear = line.match(/^(.*)\s+\(([^)]+)\)\s*$/);
    if (withYear) {
      if (pending) {
        education.push(pending);
        pending = null;
      }
      const rest = withYear[1].trim();
      const comma = rest.indexOf(", ");
      education.push({
        degree: comma >= 0 ? rest.slice(0, comma) : rest,
        school: comma >= 0 ? rest.slice(comma + 2) : "",
        year: withYear[2].trim(),
      });
    }
  }
  if (pending) education.push(pending);
  return education;
}

export function cvToMarkdown(cv: Cv): string {
  const contact = [
    cv.identity.location,
    cv.identity.phone,
    cv.identity.email,
    ...cv.identity.links,
  ]
    .filter(Boolean)
    .join(" | ");

  const experiences = cv.experiences
    .map((exp) => {
      const company = exp.companyDetail
        ? `${exp.company} (${exp.companyDetail})`
        : exp.company;
      const roleLine = [exp.role, exp.location].filter(Boolean).join(" | ");
      const dates = exp.start || exp.end ? `${exp.start} – ${exp.end}` : "";
      const bullets = exp.bullets.map((b) => `- ${b}`).join("\n");
      return [`### ${company}`, roleLine, dates, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");

  const skillLines =
    cv.skillGroups.length > 0
      ? cv.skillGroups
          .map((group) =>
            group.name ? `${group.name}: ${group.items.join(", ")}` : group.items.join(", "),
          )
          .join("\n")
      : flatSkills(cv).join(", ");

  const projects = cv.projects
    .map((project) => {
      const title = project.detail ? `${project.name} (${project.detail})` : project.name;
      const bullets = project.bullets.map((b) => `- ${b}`).join("\n");
      return `### ${title}\n${bullets}`;
    })
    .join("\n\n");

  const education = cv.education
    .map((ed) => `${ed.degree}, ${ed.school} (${ed.year})`)
    .join("\n");

  const languages = cv.languages
    .map((lang) => `${lang.name}: ${lang.level}`)
    .join("\n");

  return [
    `# ${cv.identity.name}`,
    cv.identity.title,
    contact,
    cv.highlights.join(" · "),
    "",
    "## Summary",
    cv.summary,
    "",
    "## Technical Skills",
    skillLines,
    "",
    "## Experience",
    "",
    experiences,
    "",
    "## Projects",
    "",
    projects,
    "",
    "## Education",
    education,
    "",
    "## Languages",
    languages,
    "",
  ].join("\n");
}
