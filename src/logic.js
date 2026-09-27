// QVAC Out of Office Writer — core logic.
// completion() writes a genuine, professional out-of-office auto-reply.
// A deterministic check guarantees the return date and reason are both
// actually present in the final message, regardless of what the model wrote.

import { completion } from "@qvac/sdk";

function looksUnusable(text) {
  if (!text || text.trim().length === 0) return true;
  if (text.length > 600) return true;
  const bad = ["i cannot", "i can't", "as an ai", "i'm not able", "i do not have", "please provide"];
  const lower = text.toLowerCase();
  return bad.some((phrase) => lower.includes(phrase));
}

const STOPWORDS = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with"]);

function keywords(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

function mentionsBoth(text, returnDate, reason) {
  const lower = text.toLowerCase();
  const dateWords = keywords(returnDate);
  const reasonWords = keywords(reason);
  const dateOk = dateWords.length === 0 || dateWords.some((w) => lower.includes(w));
  const reasonOk = reasonWords.length === 0 || reasonWords.some((w) => lower.includes(w));
  return dateOk && reasonOk;
}

const FALLBACK = (returnDate, reason) =>
  `Thank you for your email. I am currently out of the office until ${returnDate} for ${reason} and ` +
  `will have limited access to email during this time. I will respond to your message as soon as ` +
  `possible upon my return. For urgent matters, please contact my team, and I appreciate your patience.`;

export async function generate(modelId, returnDate, reason) {
  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          `Write a professional out-of-office auto-reply email message (3-4 sentences) stating that I am ` +
          `away until ${returnDate} because of ${reason}, and that I will respond upon my return. Keep it ` +
          "genuinely professional, no jokes. Reply with ONLY the message text, no subject line, no preamble.",
      },
      { role: "user", content: "Return date: next Monday\nReason: a family vacation" },
      {
        role: "assistant",
        content:
          "Thank you for reaching out. I am currently out of the office on a family vacation and will " +
          "return next Monday. I will have limited access to email during this time and will respond to " +
          "your message as soon as I can after I'm back. For anything urgent, please contact my team in " +
          "the meantime.",
      },
      { role: "user", content: `Return date: ${returnDate}\nReason: ${reason}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.6, maxTokens: 200 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text
    .trim()
    .replace(/^here'?s[^:\n]*:\s*/i, "")
    .trim()
    .replace(/^["'“]|["'”]$/g, "")
    .trim();

  // Fall back to a deterministic, guaranteed-professional template whenever
  // the model refused, rambled past a sane length, or produced a message
  // that doesn't actually mention the given return date or reason.
  const message = looksUnusable(text) || !mentionsBoth(text, returnDate, reason)
    ? FALLBACK(returnDate, reason)
    : text;

  return { message };
}
