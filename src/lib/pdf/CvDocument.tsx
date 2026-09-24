import type { ReactNode } from "react";
import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { flatSkills, type Cv } from "@/lib/cv/schema";
import { registerPdfFonts } from "./fonts";

registerPdfFonts();
Font.registerHyphenationCallback((word) => [word]);

const NAVY = "#1f3864";
const GRAY = "#595959";
const BODY = "#1a1a1a";
const LINK = "#0563c1";
const RULE = "#bfbfbf";

const styles = StyleSheet.create({
  page: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 28,
    fontSize: 8.75,
    fontFamily: "Carlito",
    color: BODY,
  },
  name: {
    fontSize: 20,
    fontFamily: "Carlito",
    fontWeight: 700,
    color: NAVY,
  },
  title: {
    fontSize: 11,
    marginTop: 2,
    color: GRAY,
  },
  contacts: {
    marginTop: 2,
    fontSize: 9,
    color: GRAY,
    lineHeight: 1.2,
  },
  contactSep: { color: GRAY },
  link: {
    color: LINK,
    textDecoration: "underline",
  },
  highlights: {
    marginTop: 6,
    fontSize: 9,
    color: GRAY,
  },
  highlightStrong: {
    fontFamily: "Carlito",
    fontWeight: 700,
    color: NAVY,
  },
  headerRule: {
    marginTop: 6,
    borderBottomWidth: 0.75,
    borderBottomColor: NAVY,
  },
  section: { marginTop: 4 },
  heading: {
    fontSize: 10.5,
    fontFamily: "Carlito",
    fontWeight: 700,
    color: NAVY,
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: RULE,
    paddingBottom: 1,
    marginBottom: 2.5,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.15,
    color: BODY,
  },
  skillText: {
    fontSize: 9,
    lineHeight: 1.15,
    color: BODY,
    marginBottom: 0.8,
  },
  skillLabel: {
    fontFamily: "Carlito",
    fontWeight: 700,
  },
  jobBlock: {
    marginBottom: 2.5,
  },
  jobHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  company: {
    fontSize: 8.5,
    fontFamily: "Carlito",
    fontWeight: 700,
    color: BODY,
    flexGrow: 1,
    flexShrink: 1,
  },
  companyDetail: {
    fontSize: 8.5,
    fontFamily: "Carlito",
    fontStyle: "italic",
    fontWeight: 400,
    color: GRAY,
  },
  dates: {
    fontSize: 9,
    color: GRAY,
    flexShrink: 0,
  },
  roleLine: {
    fontSize: 8.5,
    fontFamily: "Carlito",
    fontStyle: "italic",
    color: GRAY,
    marginTop: 0.5,
    marginBottom: 1.5,
  },
  role: {
    fontFamily: "Carlito",
    fontStyle: "italic",
    fontWeight: 700,
    color: NAVY,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 0.2,
    paddingLeft: 4,
  },
  bulletMark: {
    width: 10,
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#000",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.75,
    lineHeight: 1.12,
    color: BODY,
  },
});

function displayLink(href: string) {
  return href.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function hrefFor(value: string) {
  if (value.startsWith("http")) return value;
  if (value.includes("linkedin.com") || value.includes("github.com") || value.includes(".")) {
    return `https://${value}`;
  }
  return value;
}

function isWebLink(value: string) {
  return (
    value.startsWith("http") ||
    value.includes("linkedin.com") ||
    value.includes("github.com") ||
    value.includes("vercel.app")
  );
}

function Highlights({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <Text style={styles.highlights}>
      {items.map((item, index) => (
        <Text key={item}>
          {index > 0 ? "   ·   " : ""}
          {item.split(/(\d[\d+,.\-→>]*)/).map((chunk, i) =>
            /\d/.test(chunk) ? (
              <Text key={`${item}-${i}`} style={styles.highlightStrong}>
                {chunk}
              </Text>
            ) : (
              <Text key={`${item}-${i}`}>{chunk}</Text>
            ),
          )}
        </Text>
      ))}
    </Text>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <>
      {items.map((bullet) => (
        <View key={bullet} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </>
  );
}

export function CvPdfDocument({ cv }: { cv: Cv }) {
  const contactParts = [
    cv.identity.location,
    cv.identity.phone,
    cv.identity.email,
    ...cv.identity.links,
  ].filter(Boolean);

  const skillGroups =
    cv.skillGroups.length > 0
      ? cv.skillGroups
      : flatSkills(cv).length > 0
        ? [{ name: "", items: flatSkills(cv) }]
        : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{cv.identity.name}</Text>
        {cv.identity.title ? <Text style={styles.title}>{cv.identity.title}</Text> : null}
        <Text style={styles.contacts}>
          {contactParts.map((part, index) => (
            <Text key={`${part}-${index}`}>
              {index > 0 ? " | " : ""}
              {isWebLink(part) ? (
                <Link src={hrefFor(part)} style={styles.link}>
                  {displayLink(part)}
                </Link>
              ) : (
                part
              )}
            </Text>
          ))}
        </Text>
        <Highlights items={cv.highlights} />
        <View style={styles.headerRule} />

        {cv.summary ? (
          <Section title="Summary">
            <Text style={styles.summary}>{cv.summary.replace(/\s+/g, " ").trim()}</Text>
          </Section>
        ) : null}

        {skillGroups.length > 0 ? (
          <Section title="Technical Skills">
            {skillGroups.map((group) => (
              <Text key={group.name || group.items.join()} style={styles.skillText}>
                <Text style={styles.skillLabel}>
                  {group.name ? `- ${group.name} : ` : "- "}
                </Text>
                {group.items.join(", ")}
              </Text>
            ))}
          </Section>
        ) : null}

        {cv.experiences.length > 0 ? (
          <Section title="Professional Experience">
            {cv.experiences.map((exp) => (
              <View key={`${exp.company}-${exp.role}-${exp.start}`} style={styles.jobBlock}>
                <View style={styles.jobHead} wrap={false}>
                  <Text style={styles.company}>
                    {exp.company}
                    {exp.companyDetail ? (
                      <Text style={styles.companyDetail}>  ({exp.companyDetail})</Text>
                    ) : null}
                  </Text>
                  {exp.start || exp.end ? (
                    <Text style={styles.dates}>
                      {exp.start} – {exp.end}
                    </Text>
                  ) : null}
                </View>
                {exp.role || exp.location ? (
                  <Text style={styles.roleLine}>
                    {exp.role ? <Text style={styles.role}>{exp.role}</Text> : null}
                    {exp.role && exp.location ? "  |  " : null}
                    {exp.location}
                  </Text>
                ) : null}
                <Bullets items={exp.bullets} />
              </View>
            ))}
          </Section>
        ) : null}

        {cv.projects.length > 0 ? (
          <Section title="Projects">
            {cv.projects.map((project) => (
              <View key={project.name} style={styles.jobBlock}>
                <Text style={styles.company}>
                  {project.name}
                  {project.detail ? (
                    isWebLink(project.detail) || project.detail.includes(".") ? (
                      <Text>
                        {"  ("}
                        <Link src={hrefFor(project.detail)} style={styles.link}>
                          {displayLink(project.detail)}
                        </Link>
                        {")"}
                      </Text>
                    ) : (
                      <Text style={styles.companyDetail}>  ({project.detail})</Text>
                    )
                  ) : null}
                </Text>
                <Bullets items={project.bullets} />
              </View>
            ))}
          </Section>
        ) : null}

        {cv.education.length > 0 ? (
          <Section title="Education">
            {cv.education.map((ed) => (
              <Text key={`${ed.school}-${ed.degree}`} style={{ marginBottom: 1 }}>
                {ed.degree}
                {ed.school ? `, ${ed.school}` : ""}
                {ed.year ? ` (${ed.year})` : ""}
              </Text>
            ))}
          </Section>
        ) : null}

        {cv.languages.length > 0 ? (
          <View style={{ marginTop: 3 }} wrap={false}>
            <Text style={styles.heading}>Languages</Text>
            <Text>
              {cv.languages.map((lang) => `${lang.name} (${lang.level})`).join(" · ")}
            </Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
