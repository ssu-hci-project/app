import { describe, expect, it, vi } from "vitest";
import { passageContext } from "../src/lib/question-context";
import { generateQuestions } from "../src/routers/generate-questions";

describe("Gemini question generation", () => {
	it("validates and returns the generated questions", async () => {
		const text = JSON.stringify({
			questions: [
				{ chip: "왜일까?", q: "왜일까요?" },
				{ chip: "어떤 감정?", q: "어떤 감정인가요?" },
				{ chip: "떠오르는 것?", q: "무엇이 떠오르나요?" },
			],
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

	it("sends the chapter title and at most 3500 characters around the passage", () => {
		const chapter = `${"앞".repeat(5000)}고른 구절${"뒤".repeat(5000)}`;
		const context = passageContext({
			title: "책",
			author: "작가",
			chapterTitle: "봄비",
			chapter,
			quote: "고른 구절",
		});
		expect(context).toContain("장: 봄비");
		expect(context).toContain("고른 구절");
		const body = context.split("장의 맥락:\n")[1]?.split("\n\n")[0] ?? "";
		expect(body.length).toBe(3500);
		expect(body).toContain("고른 구절");
	});
});
