import { reactionEmojis, type Trace } from "@app/contract";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { personColor, personName, ReaderAvatar } from "@/entities/profile";
import { DrawingPreview, kindLabel, overlapping } from "@/entities/trace";
import type { SheetControl } from "@/features/profile-edit";
import { orpc } from "@/shared/api";
import { timeAgo } from "@/shared/lib";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AnimatedListItem,
	Badge,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	EllipsisIcon,
	InfiniteLoader,
	Popover,
	PopoverContent,
	PopoverTrigger,
	PresenceList,
	ReactionButton,
	ReactionEmoji,
	SmileIcon,
	Textarea,
	useStepOverlay,
} from "@/shared/ui";
import { type Passage, useReaderStore } from "../model/reader-store";
import { PassageQuote } from "./passage-quote";

/** 이 구절의 흔적: cards newest first, grouped by passage, with reactions and replies. */
export function TraceSheet({
	ch,
	traces,
	quoteOf,
	gate,
	onLeaveTrace,
}: {
	ch: number;
	traces: Trace[];
	quoteOf: (passage: Passage) => string;
	gate: (run: (sheet: SheetControl) => void) => void;
	onLeaveTrace: (passage: Passage) => void;
}) {
	const overlay = useStepOverlay();
	const thread = useReaderStore((state) => state.thread);
	const passage = thread?.passage;
	const listKey = `${ch}:${passage?.p}:${passage?.s}:${passage?.e}`;
	const [window, setWindow] = useState({ key: listKey, count: 20 });
	const visibleCount = window.key === listKey ? window.count : 20;
	const cards = passage
		? overlapping(traces, ch, passage.p, passage.s, passage.e).sort((a, b) =>
				b.createdAt.localeCompare(a.createdAt),
			)
		: [];
	const shown = cards.slice(0, visibleCount);
	const ranges = [...new Set(shown.map((card) => `${card.s}-${card.e}`))];
	const groups = ranges.map((range) => shown.filter((card) => `${card.s}-${card.e}` === range));
	return (
		<BottomSheet {...overlay.bind("thread", !!passage)}>
			<BottomSheetContent title="이 구절의 흔적">
				{passage && <PassageQuote quote={quoteOf(passage)} className="mx-4 mt-2" />}
				<BottomSheetBody withFooter className="flex flex-col gap-3">
					{cards.length === 0 && (
						<p className="py-6 text-center text-t6 text-muted-foreground">
							이 구절에 남은 흔적이 없어요.
						</p>
					)}
					{groups.map((group) => (
						<div key={`${group[0]?.s}-${group[0]?.e}`} className="flex flex-col gap-3">
							{groups.length > 1 && group[0]?.quote !== (passage && quoteOf(passage)) && (
								<p className="truncate font-serif text-t7 text-muted-foreground">
									“{group[0]?.quote}”
								</p>
							)}
							<PresenceList>
								{group.map((trace) => (
									<AnimatedListItem key={trace.id}>
										<TraceCard
											trace={trace}
											gate={gate}
											replies={traces
												.filter((reply) => reply.parentId === trace.id)
												.sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
										/>
									</AnimatedListItem>
								))}
							</PresenceList>
						</div>
					))}
					<InfiniteLoader
						hasMore={cards.length > visibleCount}
						loading={false}
						loadMore={() => setWindow({ key: listKey, count: visibleCount + 20 })}
					/>
				</BottomSheetBody>
				<BottomSheetFooter>
					<Button variant="secondary" size="lg" onClick={() => overlay.close()}>
						닫기
					</Button>
					<Button
						size="lg"
						disabled={!passage}
						onClick={() => {
							if (!passage) return;
							overlay.close();
							onLeaveTrace(passage);
						}}
					>
						이 구절에 흔적 남기기
					</Button>
				</BottomSheetFooter>
			</BottomSheetContent>
		</BottomSheet>
	);
}

function TraceCard({
	trace,
	replies,
	gate,
}: {
	trace: Trace;
	replies: Trace[];
	gate: (run: (sheet: SheetControl) => void) => void;
}) {
	const replyTo = useReaderStore((state) => state.replyTo);
	const draft = useReaderStore((state) => state.draft);
	const [confirming, setConfirming] = useState(false);
	const [reacting, setReacting] = useState(false);
	const [replyCount, setReplyCount] = useState(20);
	const react = useMutation(
		orpc.reactions.set.mutationOptions({ scope: { id: `reaction:${trace.id}` } }),
	);
	const temporary = trace.id.startsWith("optimistic:");
	const remove = useMutation(
		orpc.traces.remove.mutationOptions({
			onMutate: () => setConfirming(false),
		}),
	);
	const reply = useMutation(
		orpc.traces.create.mutationOptions({
			onMutate: () => useReaderStore.setState({ replyTo: null, draft: "", typing: false }),
			onError: (_error, values) => {
				if (values.kind === "reply" && !useReaderStore.getState().draft)
					useReaderStore.setState({ replyTo: trace.id, draft: values.text });
			},
		}),
	);
	const replying = replyTo === trace.id;
	const name = personName(trace.author, trace.isMine);
	const mine = trace.myReaction;
	const chips = trace.reactions;
	return (
		<article className="rounded-xl border bg-card p-4">
			<header className="flex items-center gap-2">
				<ReaderAvatar
					person={trace.author}
					name={trace.isMine ? (trace.author.nick ?? name) : name}
					size="sm"
				/>
				<span className="truncate text-st9 font-semibold">{name}</span>
				<Badge variant="secondary" className="shrink-0">
					{kindLabel[trace.kind]}
				</Badge>
				<span className="shrink-0 text-t7 text-muted-foreground">{timeAgo(trace.createdAt)}</span>
				{trace.isMine && (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="-my-2 -mr-2 ml-auto size-11"
									aria-label="흔적 메뉴"
									disabled={temporary}
								/>
							}
						>
							<EllipsisIcon />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="z-60">
							<DropdownMenuItem
								variant="destructive"
								className="min-h-11 px-3 text-st8"
								onClick={() => setConfirming(true)}
							>
								삭제
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</header>
			<div className="mt-2.5">
				{trace.kind === "qa" && (
					<p className="text-st9 leading-5 font-semibold text-brand break-keep">Q. {trace.q}</p>
				)}
				{(trace.kind === "memo" || trace.kind === "qa") && (
					<p className="mt-1 text-t6 leading-[23px] whitespace-pre-wrap break-keep">{trace.text}</p>
				)}
				{trace.kind === "react" && (
					<p className="leading-10">
						<ReactionEmoji emoji={trace.emoji ?? ""} className="size-8" />
					</p>
				)}
				{trace.kind === "draw" && trace.data && <DrawingPreview data={trace.data} />}
			</div>
			{replies.length > 0 && (
				<ul className="mt-3 flex flex-col gap-2 border-t pt-2.5 pl-3">
					{replies.slice(0, replyCount).map((item) => (
						<li key={item.id} className="text-st9 leading-5 break-keep">
							<b className="mr-1.5 font-semibold" style={{ color: personColor(item.author) }}>
								{personName(item.author, item.isMine)}
							</b>
							{item.text}
							<span className="ml-1.5 text-st10 text-muted-foreground">
								{timeAgo(item.createdAt)}
							</span>
						</li>
					))}
					{replies.length > replyCount && (
						<li>
							<InfiniteLoader
								hasMore
								loading={false}
								loadMore={() => setReplyCount((count) => count + 20)}
							/>
						</li>
					)}
				</ul>
			)}
			{replying && (
				<form
					className="mt-3 flex items-end gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						const text = draft.trim();
						if (!text) return;
						gate(({ open }) => {
							open("thread");
							reply.mutate({ kind: "reply", parentId: trace.id, text });
						});
					}}
				>
					<Textarea
						autoFocus
						aria-label={`${name}의 흔적에 생각 덧붙이기`}
						value={draft}
						maxLength={500}
						onChange={(event) => useReaderStore.setState({ draft: event.target.value })}
						onFocus={() => useReaderStore.setState({ typing: true })}
						onBlur={() => useReaderStore.setState({ typing: false })}
						placeholder="생각을 덧붙여 보세요"
						className="min-h-11 flex-1 rounded-xl text-st8"
					/>
					<Button type="submit" size="lg" disabled={!draft.trim() || reply.isPending}>
						등록
					</Button>
				</form>
			)}
			<footer className="mt-3 flex flex-wrap items-center gap-1.5">
				{chips.map((chip) => (
					<ReactionButton
						key={chip.emoji}
						emoji={chip.emoji}
						count={chip.count}
						selected={chip.emoji === mine}
						disabled={temporary}
						onClick={() =>
							react.mutate({
								traceId: trace.id,
								emoji: mine === chip.emoji ? null : (chip.emoji as (typeof reactionEmojis)[number]),
							})
						}
					/>
				))}
				<Popover open={reacting} onOpenChange={setReacting}>
					<PopoverTrigger
						render={
							<Button
								variant="ghost"
								className="h-11 px-2.5 text-muted-foreground"
								aria-label="반응 남기기"
								disabled={temporary}
							/>
						}
					>
						<SmileIcon />
						반응
					</PopoverTrigger>
					<PopoverContent side="top" className="z-60 w-auto flex-row gap-0 rounded-full p-1">
						{reactionEmojis.map((emoji) => (
							<button
								key={emoji}
								type="button"
								aria-pressed={mine === emoji}
								onClick={() => {
									setReacting(false);
									react.mutate({ traceId: trace.id, emoji: mine === emoji ? null : emoji });
								}}
								className="grid size-10 place-items-center rounded-full text-t4 aria-pressed:bg-secondary"
							>
								<ReactionEmoji emoji={emoji} />
							</button>
						))}
					</PopoverContent>
				</Popover>
				<Button
					variant="ghost"
					className="ml-auto h-11 px-2 font-semibold text-brand"
					disabled={temporary}
					onClick={() =>
						useReaderStore.setState({
							replyTo: replying ? null : trace.id,
							draft: replying ? "" : draft,
						})
					}
				>
					생각 덧붙이기
				</Button>
			</footer>
			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>이 흔적을 지울까요?</AlertDialogTitle>
						<AlertDialogDescription>
							덧붙인 생각과 반응도 함께 사라져요. 되돌릴 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={remove.isPending}
							onClick={() => remove.mutate({ traceId: trace.id })}
						>
							지우기
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</article>
	);
}
