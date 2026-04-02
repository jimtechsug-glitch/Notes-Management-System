const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    return;
  }

  console.log(`Using Key: ${key.substring(0, 5)}...`);
  const genAI = new GoogleGenerativeAI(key);

  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
  const apiVersions = ["v1", "v1beta"];

  for (const apiVersion of apiVersions) {
    console.log(`\n--- Testing API Version: ${apiVersion} ---`);
    for (const modelName of models) {
      try {
        console.log(`\nTesting model: ${modelName}...`);
        const model = genAI.getGenerativeModel(
          { model: modelName },
          { apiVersion },
        );
        const result = await model.generateContent("Say hello!");
        console.log(
          `✅ Success with ${modelName} on ${apiVersion}:`,
          result.response.text(),
        );
        return; // Stop if we find a working combination
      } catch (error) {
        console.error(
          `❌ Failed with ${modelName} on ${apiVersion}:`,
          error.message,
        );
      }
    }
  }
}

testGemini();
