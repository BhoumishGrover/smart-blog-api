import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
  );

  if (!res.ok) {
    throw new Error(`Failed to list models: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  console.log("Available Gemini models:\n");

  for (const model of data.models || []) {
    console.log(`Model name: ${model.name}`);
    console.log(`  Display name: ${model.displayName}`);
    console.log(`  Supported methods: ${model.supportedGenerationMethods}`);
    console.log("--------------------------------------------------");
  }
}

listModels().catch(console.error);