import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

/**
 * Gemini uses Google's Generative AI API.
 * We will use it for summarization + rewriting.
 */

function estimateTokens(text) {
  if (!text) return 0;
  // Use a simple heuristic for token counting
  return Math.ceil(text.length / 4);
}

function requireGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not set in environment");
  }
  return key;
}

function requireGeminiModel() {
  const model = process.env.GEMINI_MODEL;
  if (!model) {
    throw new Error("GEMINI_MODEL is not set in environment");
  }
  return model;
}

const geminiModel = requireGeminiModel();
console.log(`Using Gemini model: ${geminiModel}`);

const genAI = new GoogleGenerativeAI(requireGeminiKey());
const model = genAI.getGenerativeModel({ model: geminiModel });

async function callLLM(systemPrompt, userPrompt) {
  const apiKey = requireGeminiKey();

  const prompt = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    });

    const content =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("Empty response from Gemini");
    }

    return content.trim();
  } catch (err) {
    throw new Error(`Gemini LLM request failed: ${err.message}`);
  }
}

export async function rewriteArticle({ originalArticle, referenceArticles }) {
  if (!originalArticle || !originalArticle.content) {
    throw new Error("originalArticle with content is required");
  }
  if (!Array.isArray(referenceArticles) || referenceArticles.length === 0) {
    throw new Error("referenceArticles array is required");
  }

  // Increased limits, removing harsh truncation
  const MAX_ORIGINAL_CHARS = 4000;
  const MAX_REFERENCE_CHARS = 3000;

  const truncatedOriginal = originalArticle.content.slice(
    0,
    MAX_ORIGINAL_CHARS
  );

  console.log("\nSummarizing reference articles...");

  const summaries = [];
  for (const ref of referenceArticles) {
    const truncatedContent = ref.content.slice(0, MAX_REFERENCE_CHARS);

    const summary = await callLLM(
      "You are an expert technical editor.",
      `Summarize the following reference article in under 200 words.
Focus on key insights and arguments.
Do not copy phrases verbatim.

NOTE:
The article may be truncated due to length. Summarize based on the available content.

ARTICLE:
${truncatedContent}`
    );
    summaries.push(summary);
  }

  if (summaries.length === 0) {
    throw new Error("No suitable reference articles for summarization");
  }

  const MAX_SUMMARY_CHARS = 1000;

  const safeSummaries = summaries.map((s) => s.slice(0, MAX_SUMMARY_CHARS));

  const combinedSummaries = safeSummaries
    .join("\n")
    .slice(0, 1600);

  console.log("\nRewriting article with Gemini LLM...");

  const estimatedInputTokens =
    estimateTokens(truncatedOriginal) +
    estimateTokens(combinedSummaries) +
    estimateTokens(originalArticle.title);

  console.log(
    `\n[Token Estimate] Rewrite input ≈ ${estimatedInputTokens} tokens (Gemini safe zone)`
  );

  const rewritten = await callLLM(
    "You are an expert editor and writer.",
    `Rewrite the ORIGINAL ARTICLE into a complete, publish-ready blog post.

Requirements:
- Minimum length: 800 words
- Use a clear structure with headings and subheadings
- Write an engaging introduction and a strong concluding section
- Preserve the original topic, intent, and core arguments
- Integrate ideas from the reference summaries naturally
- Do NOT summarize; EXPAND and elaborate thoughtfully
- Do NOT plagiarize or copy sentences
- Write in a professional, explanatory blog style
- Output ONLY the article content (no meta commentary)

Context notes:
- The original article and references may be truncated
- Use them as guidance, not as strict limits

ORIGINAL TITLE:
${originalArticle.title}

ORIGINAL ARTICLE:
${truncatedOriginal}

REFERENCE SUMMARIES:
${combinedSummaries}`
  );

  return {
    rewrittenContent: rewritten,
    referenceUrls: referenceArticles.map(r => r.url)
  };
}
