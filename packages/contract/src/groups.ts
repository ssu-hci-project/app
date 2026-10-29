import { oc } from "@orpc/contract";
import { z } from "zod";
import { bookmarkSchema, bookSchema } from "./reading";
export const groupInputSchema = z.object({
	bookId: z.string(),
	name: z
		.string()
		.trim()
		.min(1, "모임 이름을 입력해주세요")
		.max(60, "모임 이름은 60자 이내로 입력해주세요"),
});
const groupSchema = z.object({
	id: z.string(),
	bookId: z.string(),
	name: z.string(),
	inviteCode: z.string(),
	createdAt: z.iso.datetime(),
	unreadCount: z.number().int().nonnegative(),
	memberCount: z.number().int().positive(),
	unreadPages: z.array(z.number().int().positive()),
});
const errors = {
	NOT_FOUND: { message: "모임이나 초대를 찾을 수 없습니다" },
	FORBIDDEN: { message: "이 모임에 먼저 참여해주세요" },
	BAD_REQUEST: { message: "책과 페이지를 확인해주세요" },
};
export type ReadingGroup = z.infer<typeof groupSchema>;
const groupId = z.object({ groupId: z.string() });
export const groupsContract = {
	list: oc.route({ method: "GET", path: "/groups", tags: ["groups"] }).output(z.array(groupSchema)),
	create: oc
		.route({ method: "POST", path: "/groups", tags: ["groups"] })
		.errors(errors)
		.input(groupInputSchema)
		.output(groupSchema),
	previewInvite: oc
		.route({ method: "GET", path: "/invites/{code}", tags: ["groups"] })
		.errors(errors)
		.input(z.object({ code: z.string() }))
		.output(
			z.object({ groupId: z.string(), name: z.string(), book: bookSchema, joined: z.boolean() }),
		),
	join: oc
		.route({ method: "POST", path: "/invites/{code}/join", tags: ["groups"] })
		.errors(errors)
		.input(z.object({ code: z.string() }))
		.output(z.object({ groupId: z.string(), bookId: z.string() })),
	leave: oc
		.route({ method: "DELETE", path: "/groups/{groupId}/membership", tags: ["groups"] })
		.errors(errors)
		.input(groupId)
		.output(z.object({ left: z.literal(true) })),
	page: oc
		.route({ method: "GET", path: "/groups/{groupId}/pages/{page}", tags: ["groups"] })
		.errors(errors)
		.input(groupId.extend({ page: bookmarkSchema.shape.page }))
		.output(z.array(bookmarkSchema)),
	markSeen: oc
		.route({ method: "POST", path: "/groups/{groupId}/seen", tags: ["groups"] })
		.errors(errors)
		.input(groupId.extend({ noteId: z.string(), version: z.number().int().positive() }))
		.output(z.object({ seen: z.literal(true) })),
};
