import { oc } from "@orpc/contract";
import { z } from "zod";

export const todoSchema = z.object({
	id: z.string(),
	title: z.string().trim().min(1).max(200),
	completed: z.boolean(),
	createdAt: z.iso.datetime(),
});

export type Todo = z.infer<typeof todoSchema>;

const notFound = { NOT_FOUND: { message: "Todo not found" } };

export const todoContract = {
	list: oc
		.route({ method: "GET", path: "/todos", summary: "List todos", tags: ["todos"] })
		.output(z.array(todoSchema)),
	create: oc
		.route({ method: "POST", path: "/todos", summary: "Create a todo", tags: ["todos"] })
		.input(todoSchema.pick({ title: true }))
		.output(todoSchema),
	update: oc
		.route({ method: "PATCH", path: "/todos/{id}", summary: "Update a todo", tags: ["todos"] })
		.errors(notFound)
		.input(
			todoSchema
				.pick({ id: true })
				.extend(todoSchema.pick({ title: true, completed: true }).partial().shape),
		)
		.output(todoSchema),
	remove: oc
		.route({ method: "DELETE", path: "/todos/{id}", summary: "Delete a todo", tags: ["todos"] })
		.errors(notFound)
		.input(todoSchema.pick({ id: true }))
		.output(z.void()),
};
