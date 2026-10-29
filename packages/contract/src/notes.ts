import { oc } from "@orpc/contract";
import { z } from "zod";
import { bookmarkSchema } from "./reading";
export const noteInputSchema = bookmarkSchema.pick({ content: true, quote: true });
const errors = {
	NOT_FOUND: { message: "기록을 찾을 수 없습니다" },
	FORBIDDEN: { message: "이 기록을 볼 수 있는 모임에 참여해주세요" },
	BAD_REQUEST: { message: "책이나 공개 범위를 확인해주세요" },
};
const id = z.object({ noteId: z.string() });
export const notesContract = {
	listMine: oc
		.route({ method: "GET", path: "/notes", tags: ["notes"] })
		.output(z.array(bookmarkSchema)),
	get: oc
		.route({ method: "GET", path: "/notes/{noteId}", tags: ["notes"] })
		.errors(errors)
		.input(id)
		.output(bookmarkSchema),
	create: oc
		.route({ method: "POST", path: "/notes", tags: ["notes"] })
		.errors(errors)
		.input(noteInputSchema.extend({ bookId: z.string(), page: bookmarkSchema.shape.page }))
		.output(bookmarkSchema),
	update: oc
		.route({ method: "PUT", path: "/notes/{noteId}", tags: ["notes"] })
		.errors(errors)
		.input(noteInputSchema.extend({ noteId: z.string() }))
		.output(bookmarkSchema),
	remove: oc
		.route({ method: "DELETE", path: "/notes/{noteId}", tags: ["notes"] })
		.errors(errors)
		.input(id)
		.output(z.object({ removed: z.literal(true) })),
	setVisibility: oc
		.route({ method: "PUT", path: "/notes/{noteId}/visibility", tags: ["notes"] })
		.errors(errors)
		.input(id.extend({ groupId: z.string().nullable() }))
		.output(bookmarkSchema),
};
