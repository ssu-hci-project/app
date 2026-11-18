import { oc } from "@orpc/contract";
import { z } from "zod";
import { libraryInput } from "./common";

const questionSchema = z.object({
	/** Short version for a compact list. */
	chip: z.string(),
	q: z.string(),
});
export type Question = z.infer<typeof questionSchema>;

export const questionsContract = {
	/**
	 * Three open questions about a passage. The server builds the context from the chapter title
	 * and the chapter text around the passage; other readers' traces are never sent to the model.
	 */
	generate: oc
		.route({ method: "POST", path: "/libraries/{libraryId}/questions", tags: ["questions"] })
		.errors({
			NOT_FOUND: { message: "책을 찾을 수 없어요" },
			FORBIDDEN: { message: "이 서재에 먼저 참여해주세요" },
		})
		.input(
			libraryInput.extend({
				bookId: z.string(),
				ch: z.number().int().nonnegative(),
				quote: z.string().trim().min(1).max(2000),
				/** Ask for a different set than last time. */
				again: z.boolean().optional(),
			}),
		)
		.output(
			z.object({
				source: z.enum(["ai", "fallback"]),
				questions: z.array(questionSchema).length(3),
			}),
		),
};
