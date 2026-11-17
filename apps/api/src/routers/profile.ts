import { eq } from "drizzle-orm";
import { profiles } from "../db/schema";
import { os } from "../orpc";

export const profileRouter = {
	get: os.profile.get.handler(async ({ context }) => {
		const row = await context.db
			.select()
			.from(profiles)
			.where(eq(profiles.userId, context.userId))
			.get();
		return { id: context.userId, nick: row?.nick ?? null, color: row?.color ?? null };
	}),
	save: os.profile.save.handler(async ({ context, input }) => {
		const values = { userId: context.userId, ...input, updatedAt: new Date().toISOString() };
		await context.db
			.insert(profiles)
			.values(values)
			.onConflictDoUpdate({
				target: profiles.userId,
				set: { nick: values.nick, color: values.color, updatedAt: values.updatedAt },
			});
		return { id: context.userId, nick: input.nick, color: input.color };
	}),
};
