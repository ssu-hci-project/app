import type { Library } from "@app/contract";

/**
 * My personal library reads "내 서재". Someone else's personal library keeps its server name
 * ("지운의 서재").
 */
export const libraryName = (library: Pick<Library, "name" | "personal" | "isOwner">) =>
	library.personal && library.isOwner ? "내 서재" : library.name;
