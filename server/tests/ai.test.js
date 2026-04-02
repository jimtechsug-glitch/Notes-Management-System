const test = require("node:test");
const assert = require("node:assert");
const proxyquire = require("proxyquire");
const sinon = require("sinon");

// Set env vars for testing
process.env.OPENAI_API_KEY = "test-key";
process.env.GEMINI_API_KEY = "test-key";
process.env.JWT_SECRET = "test-secret";

// We'll use proxyquire to mock the AI libraries in the controller
test("Searchroom Controller - Fallback Logic", async (t) => {
  const openAIStub = sinon.stub();
  const geminiStub = sinon.stub();

  // Mocking OpenAI
  class MockOpenAI {
    constructor() {
      this.chat = { completions: { create: openAIStub } };
    }
  }

  // Mocking Gemini
  class MockGemini {
    constructor() {}
    getGenerativeModel() {
      return { generateContent: geminiStub };
    }
  }

  const controller = proxyquire("../controllers/searchroomController", {
    openai: MockOpenAI,
    "@google/generative-ai": { GoogleGenerativeAI: MockGemini },
  });

  await t.test("should use OpenAI if successful", async () => {
    openAIStub.resolves({
      choices: [{ message: { content: "OpenAI Response" } }],
    });

    const req = { body: { message: "test query" }, user: { id: "user1" } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    await controller.query(req, res);

    assert.strictEqual(res.status.calledWith(200), true);
    assert.strictEqual(
      res.json.firstCall.args[0].data.reply,
      "OpenAI Response",
    );
    assert.strictEqual(res.json.firstCall.args[0].data.provider, "openai");
  });

  await t.test("should fallback to Gemini if OpenAI fails", async () => {
    openAIStub.rejects(new Error("OpenAI Failed"));
    geminiStub.resolves({ response: { text: () => "Gemini Response" } });

    const req = { body: { message: "test query" }, user: { id: "user1" } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
    };

    await controller.query(req, res);

    assert.strictEqual(res.status.calledWith(200), true);
    assert.strictEqual(
      res.json.firstCall.args[0].data.reply,
      "Gemini Response",
    );
    assert.match(res.json.firstCall.args[0].data.provider, /gemini/);
  });
});
