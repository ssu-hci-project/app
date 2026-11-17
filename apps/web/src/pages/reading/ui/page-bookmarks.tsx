import type { Bookmark } from "@app/contract";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { orpc } from "@/shared/api";
import { Button, LoadState, ResultSection } from "@/shared/ui";

export function PageBookmarks({
	bookId,
	page,
	enabled,
	groupId,
}: {
	bookId: string;
	page: number;
	enabled: boolean;
	groupId?: string;
}) {
	const legacy = useQuery(
		orpc.reading.listBookmarks.queryOptions({
			input: { bookId, page },
			enabled: enabled && !groupId,
		}),
	);
	const shared = useQuery(
		orpc.groups.page.queryOptions({
			input: { groupId: groupId ?? "", page },
			enabled: enabled && !!groupId,
		}),
	);
	const query = groupId ? shared : legacy;
	const notes = groupId ? shared.data : legacy.data?.filter((note) => note.visibility === "legacy");
	return (
		<div className="flex flex-col gap-5">
			<LoadState pending={query.isPending} error={query.isError} retry={() => query.refetch()} />
			{query.isSuccess && !notes?.length && (
				<ResultSection
					title="아직 남겨진 생각이 없어요"
					description="책으로 돌아가 계속 읽어도 괜찮아요."
				/>
			)}
			{notes?.map((note) => (
				<VisibleNote
					key={`${note.id}:${note.sharedVersion}`}
					note={note}
					groupId={groupId}
					enabled={enabled}
				/>
			))}
		</div>
	);
}

function VisibleNote({
	note,
	groupId,
	enabled,
}: {
	note: Bookmark;
	groupId?: string;
	enabled: boolean;
}) {
	const ref = useRef<HTMLElement>(null);
	const sent = useRef(false);
	const seen = useMutation(orpc.groups.markSeen.mutationOptions());
	const { mutate } = seen;
	useEffect(() => {
		if (!enabled || !groupId || note.isMine || !ref.current) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting && !sent.current) {
					sent.current = true;
					mutate(
						{ groupId, noteId: note.id, version: note.sharedVersion },
						{
							onError: () => {
								sent.current = false;
							},
						},
					);
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(ref.current);
		return () => observer.disconnect();
	}, [enabled, groupId, note.id, note.isMine, note.sharedVersion, mutate]);
	return (
		<article ref={ref} className="flex flex-col gap-3 border-b pb-5">
			<p className="text-sm font-medium">
				{note.isMine ? "내가 나눈 생각" : "함께 읽는 독자의 생각"}
			</p>
			{note.prompt && <p className="text-sm text-muted-foreground">{note.prompt}</p>}
			{note.quote && (
				<blockquote className="border-l-2 pl-3 text-sm font-medium">{note.quote}</blockquote>
			)}
			<p className="whitespace-pre-wrap break-words text-base leading-6">{note.content}</p>
			{seen.isError && (
				<Button
					variant="ghost"
					size="sm"
					className="self-start"
					onClick={() =>
						groupId && seen.mutate({ groupId, noteId: note.id, version: note.sharedVersion })
					}
				>
					확인 상태 다시 저장
				</Button>
			)}
		</article>
	);
}
