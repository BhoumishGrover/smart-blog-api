import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
  });

  const result = await model.generateContent(
    "Summarize how AI is used in healthcare in 3 bullet points."
  );
  
  console.log(result.response.text());
  
}

test();