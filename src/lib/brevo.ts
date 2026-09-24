import "server-only";

export function brevoConfigured() {
  return Boolean(
    process.env.BREVO_API_KEY &&
      process.env.BREVO_SENDER_EMAIL,
  );
}

export async function sendBrevoEmail(input: {
  toEmail: string;
  toName: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Samuel Charbit";
  if (!apiKey || !senderEmail) {
    throw new Error("BREVO_API_KEY ou BREVO_SENDER_EMAIL manquant dans .env.local");
  }

  const html = `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.45;color:#111">${input.text
    .split("\n")
    .map((line) => (line.trim() ? `<p style="margin:0 0 12px">${escapeHtml(line)}</p>` : "<br/>"))
    .join("")}</div>`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: input.toEmail, name: input.toName || undefined }],
      replyTo: { email: senderEmail, name: senderName },
      subject: input.subject,
      textContent: input.text,
      htmlContent: html,
      tags: ["cv-adapter", "ta-first-touch"],
    }),
  });

  const payload = (await response.json()) as { messageId?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.message || `Brevo HTTP ${response.status}`);
  }
  return payload.messageId ?? "";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
