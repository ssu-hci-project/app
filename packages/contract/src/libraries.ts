import { oc } from "@orpc/contract";
import { z } from "zod";
import { libraryInput, personSchema } from "./common";

export const libraryNameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "서재 이름을 적어주세요")
		.max(30, "서재 이름은 30자 이내로 적어주세요"),
});

const librarySchema = z.object({
	id: z.string(),
	/** Display name. Someone else's personal library reads "지운의 서재". */
	name: z.string(),
	inviteCode: z.string(),
	/** The library every reader gets on first visit. Its owner cannot leave it. */
	personal: z.boolean(),
	isOwner: z.boolean(),
	members: z.array(personSchema),
	createdAt: z.iso.datetime(),
});
export type Library = z.infer<typeof librarySchema>;

const errors = {
	NOT_FOUND: { message: "서재나 초대를 찾을 수 없어요" },
	FORBIDDEN: { message: "이 서재에 먼저 참여해주세요" },
	BAD_REQUEST: { message: "내 서재에서는 나갈 수 없어요" },
};
const code = z.object({ code: z.string().trim().min(1).max(64) });

export const librariesContract = {
	/** The reader's libraries, personal one first. Creates the personal library on first call. */
	list: oc
		.route({ method: "GET", path: "/libraries", tags: ["libraries"] })
		.output(z.array(librarySchema)),
	create: oc
		.route({ method: "POST", path: "/libraries", tags: ["libraries"] })
		.input(libraryNameSchema)
		.output(librarySchema),
	preview: oc
		.route({ method: "GET", path: "/invites/{code}", tags: ["libraries"] })
		.errors(errors)
		.input(code)
		.output(
			z.object({
				id: z.string(),
				name: z.string(),
				memberCount: z.number().int().nonnegative(),
				bookCount: z.number().int().nonnegative(),
				joined: z.boolean(),
			}),
		),
	join: oc
		.route({ method: "POST", path: "/invites/{code}/join", tags: ["libraries"] })
		.errors(errors)
		.input(code)
		.output(librarySchema),
	leave: oc
		.route({ method: "DELETE", path: "/libraries/{libraryId}/membership", tags: ["libraries"] })
		.errors(errors)
		.input(libraryInput)
		.output(z.object({ left: z.literal(true) })),
};
