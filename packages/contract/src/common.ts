import { z } from "zod";

/** Reader colours for names, underlines and avatars. Each has at least 4.5:1 contrast on white. */
export const readerColors = [
	"#285C48",
	"#C2410C",
	"#6D4BC3",
	"#A23B3B",
	"#0E7C86",
	"#2F3E9E",
	"#B4236B",
	"#9A6B00",
] as const;

/** One reaction per person on a passage or a card. ❤️ is the default "공감". */
export const reactionEmojis = ["❤️", "💚", "👍", "😢", "😮", "😂", "💡", "🌱"] as const;

/** Text limits shared by the schemas below and the inputs that collect them. */
export const textLimits = {
	memo: 1000,
	reply: 500,
	nick: 12,
	libraryName: 30,
	note: 200,
	search: 50,
} as const;

/** The edition a book has until someone confirms it. */
export const UNKNOWN_EDITION = "판본 미확인";

export const readerColorSchema = z.enum(readerColors);
export const reactionEmojiSchema = z.enum(reactionEmojis);

/** Who left something. `nick`/`color` stay null until the person sets a profile. */
export const personSchema = z.object({
	id: z.string(),
	nick: z.string().nullable(),
	color: z.string().nullable(),
});
export type Person = z.infer<typeof personSchema>;

export const libraryInput = z.object({ libraryId: z.string().min(1) });
