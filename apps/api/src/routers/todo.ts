import { asc, eq } from "drizzle-orm";
import { schema } from "../db";
import { os } from "../orpc";

const { todos } = schema;

export const todoRouter = {
	list: os.todo.list.handler(({ context }) =>
		context.db.select().from(todos).orderBy(asc(todos.createdAt)),
	),

	create: os.todo.create.handler(async ({ context, input }) => {
		const [todo] = await context.db.insert(todos).values({ title: input.title }).returning();
		if (!todo) throw new Error("Insert returned no row");
		return todo;
	}),

	update: os.todo.update.handler(async ({ context, input, errors }) => {
		const { id, ...changes } = input;
		const [todo] = await context.db.update(todos).set(changes).where(eq(todos.id, id)).returning();
		if (!todo) throw errors.NOT_FOUND();
		return todo;
	}),

	remove: os.todo.remove.handler(async ({ context, input, errors }) => {
		const [deleted] = await context.db
			.delete(todos)
			.where(eq(todos.id, input.id))
			.returning({ id: todos.id });
		if (!deleted) throw errors.NOT_FOUND();
	}),
};
