import { contract } from "@app/contract";
import { implement } from "@orpc/server";
import type { Db } from "./db";

export type Context = {
	db: Db;
	geminiApiKey?: string;
};

/** Contract-bound procedure builder. Every router implements a slice of it. */
export const os = implement(contract).$context<Context>();
