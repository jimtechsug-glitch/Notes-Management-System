// ============================================
// SEARCHROOM CONTROLLER
// AI-powered academic research assistant
// Powered by Google Gemini (free tier)
// ============================================

const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

// ---------------------------------------------------------------------------
// In-memory rate limiter: max 10 requests per user per minute
// ---------------------------------------------------------------------------
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Configured Models
// ---------------------------------------------------------------------------
const OPENAI_MODEL = "gpt-4o-mini";
const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-pro-latest",
];

// ---------------------------------------------------------------------------
// Build the system prompt from the authenticated student's profile
// ---------------------------------------------------------------------------
function buildPrompt(user, message) {
  const level = user.level || "secondary school";
  const className = user.class ? `class ${user.class.toUpperCase()}` : "";
  const combination = user.combination || "";

  return `You are Searchroom, an academic research assistant for a Ugandan secondary school student following the UNEB curriculum.

Student profile:
- Level: ${level}${className ? ` (${className})` : ""}
${combination ? `- Subjects / Combination: ${combination}` : ""}

Your responsibilities:
- Explain academic concepts clearly and at the appropriate level for the student
- Help with research, understanding topics, and exam preparation
- Cover science, literature, history, mathematics, and all other academic subjects
- Encourage curiosity and deeper thinking
- Keep answers accurate, concise, and easy to understand

Strict rules:
- Never write essays, assignments, or coursework on behalf of the student
- Never assist with academic dishonesty of any kind
- If a question is off-topic or inappropriate, politely redirect to academic topics

Student's question:
${message.trim()}`;
}

/**
 * Strategy: OpenAI (Primary if key exists) -> Gemini (Secondary fallback)
 */
exports.query = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a research query." });
    }

    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment.",
      });
    }

    const openaiKey = process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.trim()
      : null;
    const geminiKey = process.env.GEMINI_API_KEY
      ? process.env.GEMINI_API_KEY.trim()
      : null;

    console.log(
      `[Searchroom] Keys detected - OpenAI: ${!!openaiKey}, Gemini: ${!!geminiKey}`,
    );

    if (!openaiKey && !geminiKey) {
      return res
        .status(503)
        .json({ success: false, message: "AI assistant is not configured." });
    }

    const prompt = buildPrompt(req.user, message);
    let reply = "";
    let provider = "";

    // --- 1. Try OpenAI (Primary) ---
    if (openaiKey) {
      try {
        console.log(`[Searchroom] Attempting OpenAI (${OPENAI_MODEL})...`);
        const openai = new OpenAI({ apiKey: openaiKey });
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [{ role: "system", content: prompt }],
        });
        reply = completion.choices[0].message.content;
        provider = "openai";
      } catch (err) {
        if (err.status === 401) {
          console.error(
            "[Searchroom] OpenAI Error: 401 Unauthorized. CHECK YOUR API KEY.",
          );
        } else {
          console.warn(`[Searchroom] OpenAI failed: ${err.message}`);
        }
        // If Gemini is available, we fall through. Otherwise, throw.
        if (!geminiKey) throw err;
      }
    }

    // --- 2. Try Gemini (Fallback) ---
    if (!reply && geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);

      for (const modelName of GEMINI_MODELS) {
        try {
          console.log(`[Searchroom] Attempting Gemini (${modelName})...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          reply = result.response.text();
          provider = `gemini (${modelName})`;
          break;
        } catch (err) {
          console.warn(
            `[Searchroom] Gemini ${modelName} failed: ${err.message}`,
          );
          // Continue to next model if it's a 404
          const is404 =
            err.message.includes("404") ||
            err.message.toLowerCase().includes("not found");
          const is429 =
            err.message.includes("429") ||
            err.message.toLowerCase().includes("too many requests");

          if (is429) {
            console.error(
              `[Searchroom] Gemini ${modelName} Quota Exceeded (429).`,
            );
          }

          if (!is404 && !is429) break;
        }
      }
    }

    if (!reply) {
      throw new Error("All AI providers failed to respond.");
    }

    return res.status(200).json({
      success: true,
      data: {
        reply,
        query: message.trim(),
        provider,
      },
    });
  } catch (error) {
    console.error("[Searchroom] Fatal error:", error.message);
    res.status(503).json({
      success: false,
      message:
        "The AI service is temporarily unavailable. Please try again later.",
    });
  }
};
