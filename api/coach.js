// Vercel serverless function: POST /api/coach  ->  { tip: "..." }
// Env vars (set in Vercel project settings, never in the browser):
//   GROQ_API_KEY  your key from console.groq.com/keys (starts with gsk_)
//   GROQ_MODEL    optional, defaults below. Model names change, so check console.groq.com/docs/models

const SYSTEM = `You are Cikgu, a warm sign-language coach inside a practice app for Malaysian Sign Language (BIM) fingerspelling.
The app has ALREADY decided the learner's sign is not correct. You only explain the fix.

Rules:
- Focus EXCLUSIVELY on the ONE single primary finger to adjust right now. Even if other fingers might be off, do NOT mention them. Do not tell the learner to spread all fingers or move all fingers at once.
- Give ONE specific correction for that primary finger (e.g. straighten your index finger, or tuck your thumb).
- Use ONLY the facts in the user message: the target sign, the primary finger error, and what the app thinks the learner was signing.
- Never invent facts about how any sign looks. If the cue and error don't cover it, say less.
- Never say a sign is correct or incorrect. Never mention other signs except the one the app says the learner was making.
- Maximum 1-2 short sentences. Friendly and encouraging. No emojis, no lists.
- Reply in the requested language: "ms" = Bahasa Malaysia, "en" = English.`;

const clip = (v, n = 60) => String(v ?? "").replace(/[\r\n]+/g, " ").slice(0, n);

export default async function handler(req, res) {

  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: "Missing GROQ_API_KEY" });

  const b = req.body || {};
  const errors = (Array.isArray(b.errors) ? b.errors : []).slice(0, 5)
    .map(e => `${clip(e.finger, 20)}: ${clip(e.issue, 30)}`);
  const primaryError = errors[0] || "";
  const facts = [
    `Target sign: ${clip(b.sign, 8)}`,
    primaryError ? `Single finger to fix right now: ${primaryError}` : `Cue for this sign: ${clip(b.cue, 160)}`,
    b.predicted ? `The app thinks the learner is signing: ${clip(b.predicted, 8)}` : "",
    b.history ? `Recent history: ${clip(b.history, 160)}` : "",
    `Language: ${b.lang === "ms" ? "ms" : "en"}`,
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: facts }],
        temperature: 0.4,
        max_tokens: 90,
      }),
      signal: AbortSignal.timeout(6000),
    });
    if (!r.ok) return res.status(502).json({ error: `Groq ${r.status}` });
    const j = await r.json();
    const tip = j.choices?.[0]?.message?.content?.trim();
    if (!tip) return res.status(502).json({ error: "Empty reply" });
    return res.status(200).json({ tip });
  } catch (e) {
    return res.status(502).json({ error: "Coach unavailable" });
  }
}