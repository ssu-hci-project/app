import type { Bookmark } from "@app/contract";
import { ActionButton, Text } from "@seed-design/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { orpc } from "@/shared/api";
import { LoadState, ResultSection } from "@/shared/ui";

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
		<div className="flex flex-col gap-x5">
			<LoadState pending={query.isPending} error={query.isError} retry={() => query.refetch()} />
			{query.isSuccess && !notes?.length && (
				<ResultSection
					size="medium"
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
		<article ref={ref} className="flex flex-col gap-x3 border-b border-stroke-neutral-weak pb-x5">
			<Text textStyle="t4Medium">{note.isMine ? "내가 나눈 생각" : "함께 읽는 독자의 생각"}</Text>
			{note.prompt && (
				<Text textStyle="t3Regular" color="fg.neutralMuted">
					{note.prompt}
				</Text>
			)}
			{note.quote && (
				<blockquote className="border-l-2 border-stroke-neutral-weak pl-x3">
					<Text textStyle="t4Medium">{note.quote}</Text>
				</blockquote>
			)}
			<Text as="p" textStyle="articleBody" className="whitespace-pre-wrap break-words">
				{note.content}
			</Text>
			{seen.isError && (
				<ActionButton
					variant="ghost"
					size="small"
					onClick={() =>
						groupId && seen.mutate({ groupId, noteId: note.id, version: note.sharedVersion })
					}
				>
					확인 상태 다시 저장
				</ActionButton>
			)}
		</article>
	);
}
