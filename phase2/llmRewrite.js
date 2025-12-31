import axios from "axios";
import "dotenv/config";

/**
 * Groq uses an OpenAI-compatible chat completions API.
 * We will use it for summarization + rewriting.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function requireGroqKey() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is not set in environment");
  }
  return key;
}

async function callLLM(systemPrompt, userPrompt) {
  const apiKey = requireGroqKey();

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Groq");
    }

    return content.trim();
  } catch (err) {
    if (err.response) {
      throw new Error(
        `Groq LLM request failed: ${err.response.status} ${err.response.statusText}`
      );
    }
    throw new Error(`Groq LLM request failed: ${err.message}`);
  }
}

export async function rewriteArticle({ originalArticle, referenceArticles }) {
  if (!originalArticle || !originalArticle.content) {
    throw new Error("originalArticle with content is required");
  }
  if (!Array.isArray(referenceArticles) || referenceArticles.length === 0) {
    throw new Error("referenceArticles array is required");
  }
  const MAX_ORIGINAL_CHARS = 2000;
  const MAX_REFERENCE_CHARS = 2000;
  const BLOCKED_DOMAINS = [
    "pmc.ncbi.nlm.nih.gov",
    "ncbi.nlm.nih.gov",
    "nature.com",
    "springer.com",
    "elsevier.com",
    "sciencedirect.com",
  ];

  const truncatedOriginal = originalArticle.content.slice(
    0,
    MAX_ORIGINAL_CHARS
  );

  console.log("\nSummarizing reference articles...");

  const summaries = [];
  for (const ref of referenceArticles) {
    const url = ref.originalUrl || ref.url || "";
    if (BLOCKED_DOMAINS.some((domain) => url.includes(domain))) {
      console.log(`Skipping academic source: ${url}`);
      continue;
    }

    const truncatedContent = ref.content.slice(0, MAX_REFERENCE_CHARS);

    const summary = await callLLM(
      "You are an expert technical editor.",
      `Summarize the following reference article in under 150 words.
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

  const MAX_SUMMARY_CHARS = 600;

  const safeSummaries = summaries.map((s) => s.slice(0, MAX_SUMMARY_CHARS));

  const combinedSummaries = safeSummaries
    .join("\n")
    .slice(0, 1200);

  console.log("\nRewriting article with Groq LLM...");

  const rewritten = await callLLM(
    "You are an expert editor and writer.",
    `Rewrite the ORIGINAL ARTICLE below.
Improve clarity and structure.
Preserve intent and meaning.
Naturally integrate insights from the REFERENCE SUMMARIES.
Do NOT plagiarize or copy sentences.
Output plain readable text only.

NOTE:
The original article may be truncated due to length.
Rewrite based on the provided content while preserving intent.

ORIGINAL TITLE:
${originalArticle.title}

ORIGINAL ARTICLE:
${truncatedOriginal}

REFERENCE SUMMARIES:
${combinedSummaries}`
  );

  return rewritten;
}
