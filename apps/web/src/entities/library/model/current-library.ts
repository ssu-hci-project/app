import type { Library } from "@app/contract";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "usehooks-ts";
import { orpc } from "@/shared/api";

const KEY = "exchange-reading:library";

/**
 * The library the reader is looking at. Remembered on this device; falls back to the personal
 * library when the remembered one is gone (left it, or a new browser).
 */
export function useCurrentLibrary() {
	const libraries = useQuery(orpc.libraries.list.queryOptions());
	const [storedId, setStoredId] = useLocalStorage<string | null>(KEY, null);
	const list = libraries.data ?? [];
	const library: Library | undefined = list.find((entry) => entry.id === storedId) ?? list[0];
	return {
		query: libraries,
		libraries: list,
		library,
		libraryId: library?.id,
		select: (id: string) => setStoredId(id),
	};
}
