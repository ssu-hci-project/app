import { oc } from "@orpc/contract";
import { z } from "zod";
import { libraryInput, personSchema, textLimits } from "./common";

export const libraryNameSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "모임 이름을 적어주세요")
		.max(textLimits.libraryName, `모임 이름은 ${textLimits.libraryName}자 이내로 적어주세요`),
});

/** A book on a reading group's shelf. */
const groupBookSchema = z.object({
	id: z.string(),
	title: z.string(),
	author: z.string(),
	color: z.string(),
});
export type GroupBook = z.infer<typeof groupBookSchema>;

const librarySchema = z.object({
	id: z.string(),
	/** Display name. Someone else's personal library reads "지운의 서재". */
	name: z.string(),
	inviteCode: z.string(),
	/** The library every reader gets on first visit. Its owner cannot leave it. */
	personal: z.boolean(),
	isOwner: z.boolean(),
	/** A group's shelf: the books its members chose to read together, oldest first. Empty for personal libraries. */
	books: z.array(groupBookSchema),
	members: z.array(personSchema),
	createdAt: z.iso.datetime(),
});
export type Library = z.infer<typeof librarySchema>;

const errors = {
	NOT_FOUND: { message: "서재나 초대를 찾을 수 없어요" },
	FORBIDDEN: { message: "이 서재에 먼저 참여해주세요" },
	BAD_REQUEST: { message: "내 서재에서는 나갈 수 없어요" },
};
const bookErrors = {
	NOT_FOUND: { message: "책을 찾을 수 없어요" },
	FORBIDDEN: { message: "이 모임에 먼저 참여해주세요" },
	BAD_REQUEST: { message: "내 서재에는 모임 책을 담을 수 없어요" },
};
/** At most this many books in one request. */
const GROUP_BOOKS_PER_REQUEST = 20;
const bookIds = z.array(z.string().min(1)).max(GROUP_BOOKS_PER_REQUEST);
const code = z.object({ code: z.string().trim().min(1).max(64) });

export const librariesContract = {
	/** The reader's libraries, personal one first. Creates the personal library on first call. */
	list: oc
		.route({ method: "GET", path: "/libraries", tags: ["libraries"] })
		.output(z.array(librarySchema)),
	/** Creates a reading group, optionally with the public-domain books it starts with. */
	create: oc
		.route({ method: "POST", path: "/libraries", tags: ["libraries"] })
		.errors(bookErrors)
		.input(libraryNameSchema.extend({ bookIds: bookIds.default([]) }))
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
				books: z.array(groupBookSchema),
				joined: z.boolean(),
			}),
		),
	/** Any member adds books readable in the group to its shelf. Already-added books are kept. */
	addBooks: oc
		.route({ method: "POST", path: "/libraries/{libraryId}/books", tags: ["libraries"] })
		.errors(bookErrors)
		.input(libraryInput.extend({ bookIds: bookIds.min(1) }))
		.output(librarySchema),
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
