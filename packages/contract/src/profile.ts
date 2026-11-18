import { oc } from "@orpc/contract";
import { z } from "zod";
import { readerColorSchema, textLimits } from "./common";

export const profileInputSchema = z.object({
	nick: z
		.string()
		.trim()
		.min(1, "이름을 적어주세요")
		.max(textLimits.nick, `이름은 ${textLimits.nick}자 이내로 적어주세요`),
	color: readerColorSchema,
});

const profileSchema = z.object({
	id: z.string(),
	nick: z.string().nullable(),
	color: z.string().nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

export const profileContract = {
	get: oc.route({ method: "GET", path: "/profile", tags: ["profile"] }).output(profileSchema),
	save: oc
		.route({ method: "PUT", path: "/profile", tags: ["profile"] })
		.input(profileInputSchema)
		.output(profileSchema),
};
