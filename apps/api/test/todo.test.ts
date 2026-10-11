import { env } from "cloudflare:workers";
import type { Contract } from "@app/contract";
import { createORPCClient, isDefinedError, safe } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { describe, expect, it } from "vitest";
import app from "../src/index";

// The same typed client apps/web uses, wired straight into the Worker.
const client: ContractRouterClient<Contract> = createORPCClient(
	new RPCLink({
		url: "http://test.local/api/rpc",
		fetch: async (request) => app.fetch(request, env),
	}),
);

describe("todo API", () => {
	it("creates, lists, updates and deletes a todo", async () => {
		const created = await client.todo.create({ title: "테스트 작성" });
		expect(created).toMatchObject({ title: "테스트 작성", completed: false });

		const list = await client.todo.list();
		expect(list.map((t) => t.id)).toContain(created.id);

		const updated = await client.todo.update({ id: created.id, completed: true });
		expect(updated.completed).toBe(true);

		await client.todo.remove({ id: created.id });
		expect(await client.todo.list()).not.toContainEqual(
			expect.objectContaining({ id: created.id }),
		);
	});

	it("returns a typed NOT_FOUND error for a missing todo", async () => {
		const [error] = await safe(client.todo.update({ id: "missing", completed: true }));
		expect(isDefinedError(error) && error.code).toBe("NOT_FOUND");
	});

	it("rejects an empty title", async () => {
		const [error] = await safe(client.todo.create({ title: "   " }));
		expect(error).toMatchObject({ code: "BAD_REQUEST" });
	});

	it("serves the REST endpoint and API docs", async () => {
		const health = await app.request("/api/health", {}, env);
		expect(await health.json()).toEqual({ status: "ok" });

		const docs = await app.request("/api/docs", {}, env);
		expect(docs.status).toBe(200);
	});
});
