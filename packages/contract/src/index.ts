import { oc } from "@orpc/contract";
import { z } from "zod";
import { readingContract } from "./reading";

/**
 * The single source of truth for the API: every procedure's path, input and
 * output lives here. `apps/api` implements it, `apps/web` calls it — both get
 * the same types, so a change here is a type error on both sides until fixed.
 */
export const contract = {
	health: oc
		.route({ method: "GET", path: "/health", summary: "Health check", tags: ["system"] })
		.output(z.object({ status: z.literal("ok") })),
	reading: readingContract,
};

export type Contract = typeof contract;
