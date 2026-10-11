import { z } from "zod";

export const todoSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	completed: z.boolean(),
	createdAt: z.string(),
});

export type Todo = z.infer<typeof todoSchema>;
