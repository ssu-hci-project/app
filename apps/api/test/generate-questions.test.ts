import { describe, expect, it, vi } from "vitest";
import { generateQuestions } from "../src/routers/generate-questions";

describe("Gemini question generation", () => {
	it("validates and returns the generated questions", async () => {
		const text = JSON.stringify({
			questions: ["왜일까요?", "어떤 감정인가요?", "무엇이 떠오르나요?"],
		});
		const body = JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] });
		const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
		expect(await generateQuestions("test-key", "독서 맥락", request)).toHaveLength(3);
		expect(request).toHaveBeenCalledOnce();
	});

	it("rejects a failed request or malformed response", async () => {
		const failed = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 429 }));
		await expect(generateQuestions("test-key", "맥락", failed)).rejects.toThrow();
		const malformed = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}"));
		await expect(generateQuestions("test-key", "맥락", malformed)).rejects.toThrow();
	});
});
