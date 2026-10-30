import { isDefinedError } from "@orpc/client";
import { Text } from "@seed-design/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { orpc } from "@/shared/api";
import { LoadState, ResultSection } from "@/shared/ui";

/** 고른 문장은 기록의 "기억할 구절"이 되므로 그 길이 제한에 맞춥니다. */
const QUOTE_LIMIT = 200;

/**
 * 한 쪽의 본문을 보여주고, 본문 안에서 고른 문장을 알려줍니다. 다음 쪽은 미리 받아 둡니다.
 */
export function PageText({
	bookId,
	page,
	onSelectQuote,
}: {
	bookId: string;
	page: number;
	onSelectQuote: (quote: string | null) => void;
}) {
	const query = useQuery(orpc.reading.getPage.queryOptions({ input: { bookId, page } }));
	const queryClient = useQueryClient();
	const textRef = useRef<HTMLDivElement>(null);
	const pageCount = query.data?.pageCount;

	useEffect(() => {
		if (pageCount && page < pageCount)
			queryClient.prefetchQuery(
				orpc.reading.getPage.queryOptions({ input: { bookId, page: page + 1 } }),
			);
	}, [bookId, page, pageCount, queryClient]);

	// 쪽을 넘기면 새 쪽의 첫 줄부터 읽게 합니다.
	const shownPage = useRef(page);
	useEffect(() => {
		if (shownPage.current === page) return;
		shownPage.current = page;
		textRef.current?.scrollIntoView?.({ block: "start" });
		onSelectQuote(null);
	}, [page, onSelectQuote]);

	useEffect(() => {
		let clear: number | undefined;
		const update = () => {
			const selection = document.getSelection();
			const inside =
				!!selection &&
				!selection.isCollapsed &&
				!!textRef.current?.contains(selection.anchorNode) &&
				!!textRef.current?.contains(selection.focusNode);
			window.clearTimeout(clear);
			if (inside) {
				onSelectQuote(selection.toString().replace(/\s+/g, " ").trim().slice(0, QUOTE_LIMIT));
				return;
			}
			// 버튼을 누르는 순간 선택이 풀려도 버튼이 사라지지 않도록 잠시 기다립니다.
			clear = window.setTimeout(() => onSelectQuote(null), 400);
		};
		document.addEventListener("selectionchange", update);
		return () => {
			document.removeEventListener("selectionchange", update);
			window.clearTimeout(clear);
		};
	}, [onSelectQuote]);

	if (query.isError && isDefinedError(query.error) && query.error.code === "NOT_FOUND")
		return (
			<ResultSection
				size="medium"
				title="이 책은 아직 본문이 없어요"
				description="저작권이 만료된 작품만 앱에서 읽을 수 있어요."
			/>
		);
	return (
		<div ref={textRef} className="scroll-mt-x16">
			<LoadState
				shape="article"
				pending={query.isPending}
				error={query.isError}
				retry={() => query.refetch()}
			/>
			{query.data && (
				<article aria-label={`${page}쪽 본문`} className="flex flex-col gap-x4">
					{query.data.text.split("\n\n").map((paragraph, index) => (
						<Text
							// 같은 쪽 안에서 문단 순서는 바뀌지 않아요.
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed page text
							key={index}
							as="p"
							textStyle="articleBody"
							className="whitespace-pre-wrap break-keep"
						>
							{paragraph}
						</Text>
					))}
				</article>
			)}
		</div>
	);
}
