import { flatSkills, type Cv } from "./schema";

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function experienceKey(company: string, role: string, start: string, end: string) {
  return [company, role, start, end].map(norm).join("|");
}

function densifyBullets(masterBullets: string[], adaptedBullets: string[]) {
  const rewritten = adaptedBullets.map((b) => b.trim()).filter(Boolean);
  if (rewritten.length >= masterBullets.length && rewritten.length >= 3) {
    return rewritten;
  }
  const seen = new Set(rewritten.map(norm));
  const filled = [...rewritten];
  for (const bullet of masterBullets) {
    if (filled.length >= Math.max(masterBullets.length, 4)) break;
    if (!seen.has(norm(bullet))) {
      filled.push(bullet);
      seen.add(norm(bullet));
    }
  }
  return filled.length > 0 ? filled : masterBullets;
}

export function sanitizeAdaptedCv(master: Cv, adapted: Cv): Cv {
  const allowedSkills = new Set(flatSkills(master).map(norm));
  const allowedCompanies = new Set(master.experiences.map((e) => norm(e.company)));
  const allowedExpKeys = new Set(
    master.experiences.map((e) =>
      experienceKey(e.company, e.role, e.start, e.end),
    ),
  );
  const allowedSchools = new Set(master.education.map((e) => norm(e.school)));
  const allowedLangs = new Set(master.languages.map((l) => norm(l.name)));
  const allowedProjects = new Set(master.projects.map((p) => norm(p.name)));

  const experiences = adapted.experiences.filter((exp) => {
    if (!allowedCompanies.has(norm(exp.company))) return false;
    const exact = experienceKey(exp.company, exp.role, exp.start, exp.end);
    if (allowedExpKeys.has(exact)) return true;
    return master.experiences.some(
      (m) =>
        norm(m.company) === norm(exp.company) &&
        norm(m.role) === norm(exp.role),
    );
  });

  const seen = new Set<string>();
  const uniqueExperiences = experiences.filter((exp) => {
    const key = experienceKey(exp.company, exp.role, exp.start, exp.end);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const lockedExperiences = (uniqueExperiences.length > 0
    ? uniqueExperiences
    : master.experiences
  ).map((exp) => {
    const source =
      master.experiences.find(
        (m) =>
          norm(m.company) === norm(exp.company) &&
          norm(m.role) === norm(exp.role),
      ) ?? master.experiences.find((m) => norm(m.company) === norm(exp.company));
    return {
      ...exp,
      company: source?.company ?? exp.company,
      companyDetail: source?.companyDetail ?? exp.companyDetail,
      location: source?.location ?? exp.location,
      start: source?.start ?? exp.start,
      end: source?.end ?? exp.end,
      bullets: densifyBullets(source?.bullets ?? [], exp.bullets),
    };
  });

  const adaptedCompanies = new Set(lockedExperiences.map((e) => norm(e.company)));
  for (const missing of master.experiences) {
    if (!adaptedCompanies.has(norm(missing.company))) {
      lockedExperiences.push(missing);
    }
  }

  const skillGroups = master.skillGroups.map((masterGroup) => {
    const adaptedGroup = adapted.skillGroups.find((g) => norm(g.name) === norm(masterGroup.name));
    if (!adaptedGroup) return masterGroup;
    const allowed = new Set(masterGroup.items.map(norm));
    const preferred = adaptedGroup.items.filter((item) => allowed.has(norm(item)));
    const seen = new Set(preferred.map(norm));
    const rest = masterGroup.items.filter((item) => !seen.has(norm(item)));
    return { name: masterGroup.name, items: [...preferred, ...rest] };
  });

  const projects = (adapted.projects.length > 0 ? adapted.projects : master.projects)
    .filter((project) => allowedProjects.has(norm(project.name)))
    .map((project) => {
      const source = master.projects.find((m) => norm(m.name) === norm(project.name));
      return {
        name: source?.name ?? project.name,
        detail: source?.detail ?? project.detail,
        bullets: densifyBullets(source?.bullets ?? [], project.bullets),
      };
    });

  const skills = (skillGroups.length > 0
    ? skillGroups.flatMap((group) => group.items)
    : adapted.skills.filter((skill) => allowedSkills.has(norm(skill)))
  );

  return {
    identity: {
      ...master.identity,
      title: adapted.identity.title?.trim()
        ? adapted.identity.title
        : master.identity.title,
    },
    highlights: master.highlights,
    summary: (adapted.summary.trim() || master.summary).replace(/\s+/g, " ").trim(),
    experiences: lockedExperiences,
    skillGroups: skillGroups.length > 0 ? skillGroups : master.skillGroups,
    skills: skills.length > 0 ? skills : flatSkills(master),
    projects: projects.length > 0 ? projects : master.projects,
    education:
      adapted.education.filter((ed) => allowedSchools.has(norm(ed.school))).length > 0
        ? adapted.education.filter((ed) => allowedSchools.has(norm(ed.school)))
        : master.education,
    languages:
      adapted.languages.filter((lang) => allowedLangs.has(norm(lang.name))).length > 0
        ? adapted.languages.filter((lang) => allowedLangs.has(norm(lang.name)))
        : master.languages,
  };
}

export function cvDiff(master: Cv, adapted: Cv) {
  const masterExpOrder = master.experiences.map((e) =>
    experienceKey(e.company, e.role, e.start, e.end),
  );
  const adaptedExpOrder = adapted.experiences.map((e) =>
    experienceKey(e.company, e.role, e.start, e.end),
  );
  const masterSkillList = flatSkills(master);
  const adaptedSkillList = flatSkills(adapted);

  return {
    titleChanged: master.identity.title !== adapted.identity.title,
    summaryChanged: master.summary !== adapted.summary,
    experienceReordered: masterExpOrder.join() !== adaptedExpOrder.join(),
    skillsDropped: masterSkillList.filter(
      (s) => !adaptedSkillList.some((a) => norm(a) === norm(s)),
    ),
    skillsKept: adaptedSkillList,
  };
}
