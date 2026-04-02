/**
 * AI API Keys Configuration
 *
 * IMPORTANT SECURITY WARNING:
 * --------------------------
 * If you commit this file to GitHub with REAL keys:
 * 1. Your repository MUST be PRIVATE.
 * 2. If the repository is PUBLIC, your keys will be stolen and disabled immediately.
 *
 * This file allows you to 'bake' the keys into your Windows executable (.exe)
 * so that you don't need to copy a .env file to the lab server/computers.
 */

module.exports = {
  // These keys are now safely loaded from environment variables or GitHub Secrets
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};
