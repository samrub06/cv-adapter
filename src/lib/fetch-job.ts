import * as cheerio from "cheerio";
import { assertSafePublicUrl } from "./ssrf";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 5;

export async function fetchJobPage(rawUrl: string) {
  let current = await assertSafePublicUrl(rawUrl);

  for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(current.toString(), {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirection sans Location");
        current = await assertSafePublicUrl(new URL(location, current).toString());
        continue;
      }

      if (!response.ok) {
        throw new Error(`Fetch HTTP ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_BYTES) {
        throw new Error("Page trop volumineuse");
      }

      const html = buffer.toString("utf8");
      const text = htmlToText(html);
      if (text.length < 80) {
        throw new Error("Texte trop court — colle l'annonce a la main");
      }

      return { html, text, finalUrl: current.toString() };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout en recuperant l'offre");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error("Trop de redirections");
}

export function htmlToText(html: string) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, nav, footer, header, iframe").remove();
  const text = $("body").text() || $.root().text();
  return text.replace(/\s+/g, " ").trim();
}
