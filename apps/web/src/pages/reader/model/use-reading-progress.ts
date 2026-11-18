import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { orpc } from "@/shared/api";
import { today } from "@/shared/lib";
import { saveLocalPosition } from "../lib/position";

/** Save actual position changes, not renders or query refreshes. */
export function useReadingProgress({
	bookId,
	ch,
	page,
	pages,
	pct,
	ready,
}: {
	bookId: string;
	ch: number | null;
	page: number;
	pages: number;
	pct: number;
	ready: boolean;
}) {
	const { mutate } = useMutation(
		orpc.progress.save.mutationOptions({
			meta: {
				invalidates: [orpc.books.list.key(), orpc.books.listPage.key(), orpc.reads.month.key()],
			},
		}),
	);
	const save = useCallback(
		(position: { ch: number; ratio: number; pct: number }) => {
			mutate({ bookId, ...position, date: today() });
		},
		[bookId, mutate],
	);
	const persist = useDebounceCallback(save, 1000);
	useEffect(() => {
		if (!ready || ch === null) return;
		const ratio = pages > 1 ? page / pages : 0;
		saveLocalPosition(bookId, ch, ratio);
		persist({ ch, ratio, pct });
		// Cancel the actual debounced function, including on book changes and unmount.
		return () => persist.cancel();
	}, [ready, ch, page, pages, pct, bookId, persist]);
}
