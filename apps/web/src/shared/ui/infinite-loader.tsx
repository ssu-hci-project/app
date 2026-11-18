import { useEffect, useRef } from "react";
import { Button } from "./button";

/** Automatic loading near the scroll edge, with an accessible manual retry/fallback. */
export function InfiniteLoader({
	hasMore,
	loading,
	error,
	loadMore,
}: {
	hasMore: boolean;
	loading: boolean;
	error?: boolean;
	loadMore: () => unknown;
}) {
	const sentinel = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const element = sentinel.current;
		if (!element || !hasMore || loading || error || typeof IntersectionObserver === "undefined")
			return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) loadMore();
			},
			{ rootMargin: "240px" },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [hasMore, loading, error, loadMore]);
	if (!hasMore && !loading) return null;
	return (
		<div ref={sentinel} className="flex min-h-16 items-center justify-center px-5 py-3">
			{loading ? (
				<span role="status" className="flex items-center gap-2 text-st9 text-muted-foreground">
					더 불러오는 중이에요
				</span>
			) : (
				<Button variant="ghost" onClick={loadMore}>
					{error ? "다시 불러오기" : "더 보기"}
				</Button>
			)}
		</div>
	);
}
