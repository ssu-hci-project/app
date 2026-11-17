import { reactionEmojis, type Trace } from "@app/contract";
import { useMutation } from "@tanstack/react-query";
import { EllipsisIcon, SmilePlusIcon } from "lucide-react";
import { useState } from "react";
import { personColor, personName, ReaderAvatar } from "@/entities/profile";
import { DrawingPreview, kindLabel, overlapping } from "@/entities/trace";
import type { SheetControl } from "@/features/profile-edit";
import { orpc } from "@/shared/api";
import { cn, timeAgo } from "@/shared/lib";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Textarea,
	useNotice,
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
	const cards = passage
		? overlapping(traces, ch, passage.p, passage.s, passage.e).sort((a, b) =>
				b.createdAt.localeCompare(a.createdAt),
			)
		: [];
	const ranges = [...new Set(cards.map((card) => `${card.s}-${card.e}`))];
	const groups = ranges.map((range) => cards.filter((card) => `${card.s}-${card.e}` === range));
	return (
		<BottomSheet {...overlay.bind("thread")}>
			<BottomSheetContent title="이 구절의 흔적">
				{passage && <PassageQuote quote={quoteOf(passage)} className="mx-4 mt-2" />}
				<BottomSheetBody withFooter className="flex flex-col gap-3">
					{cards.length === 0 && (
						<p className="py-6 text-center text-[15px] text-muted-foreground">
							이 구절에 남은 흔적이 없어요.
						</p>
					)}
					{groups.map((group) => (
						<div key={`${group[0]?.s}-${group[0]?.e}`} className="flex flex-col gap-3">
							{groups.length > 1 && group[0]?.quote !== (passage && quoteOf(passage)) && (
								<p className="truncate font-serif text-[13px] text-muted-foreground">
									“{group[0]?.quote}”
								</p>
							)}
							{group.map((trace) => (
								<TraceCard
									key={trace.id}
									trace={trace}
									replies={traces
										.filter((reply) => reply.parentId === trace.id)
										.sort((a, b) => a.createdAt.localeCompare(b.createdAt))}
									gate={gate}
								/>
							))}
						</div>
					))}
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
	const notify = useNotice();
	const replyTo = useReaderStore((state) => state.replyTo);
	const draft = useReaderStore((state) => state.draft);
	const [confirming, setConfirming] = useState(false);
	const [reacting, setReacting] = useState(false);
	const react = useMutation(orpc.reactions.set.mutationOptions());
	const remove = useMutation(
		orpc.traces.remove.mutationOptions({
			onSuccess: () => {
				setConfirming(false);
				notify("흔적을 지웠어요");
			},
			onError: () => notify("지우지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	const reply = useMutation(
		orpc.traces.create.mutationOptions({
			onSuccess: () => useReaderStore.setState({ replyTo: null, draft: "", typing: false }),
		}),
	);
	const replying = replyTo === trace.id;
	const name = personName(trace.author, trace.isMine);
	// Optimistic: show my new reaction right away.
	const mine = react.isPending ? (react.variables?.emoji ?? null) : trace.myReaction;
	const chips = adjust(trace.reactions, trace.myReaction, mine);
	return (
		<article className="rounded-xl border bg-card p-4">
			<header className="flex items-center gap-2">
				<ReaderAvatar
					person={trace.author}
					name={trace.isMine ? (trace.author.nick ?? name) : name}
					size="sm"
				/>
				<span className="truncate text-sm font-semibold">{name}</span>
				<Badge variant="secondary" className="shrink-0">
					{kindLabel[trace.kind]}
				</Badge>
				<span className="shrink-0 text-[13px] text-muted-foreground">
					{timeAgo(trace.createdAt)}
				</span>
				{trace.isMine && (
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									variant="ghost"
									size="icon"
									className="-my-2 -mr-2 ml-auto size-11"
									aria-label="흔적 메뉴"
								/>
							}
						>
							<EllipsisIcon />
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="z-60">
							<DropdownMenuItem
								variant="destructive"
								className="min-h-11 px-3 text-base"
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
					<p className="text-sm leading-5 font-semibold text-primary break-keep">Q. {trace.q}</p>
				)}
				{(trace.kind === "memo" || trace.kind === "qa") && (
					<p className="mt-1 text-[15px] leading-[23px] whitespace-pre-wrap break-keep">
						{trace.text}
					</p>
				)}
				{trace.kind === "react" && <p className="text-[32px] leading-10">{trace.emoji}</p>}
				{trace.kind === "draw" && trace.data && <DrawingPreview data={trace.data} />}
			</div>
			{replies.length > 0 && (
				<ul className="mt-3 flex flex-col gap-2 border-t pt-2.5 pl-3">
					{replies.map((item) => (
						<li key={item.id} className="text-sm leading-5 break-keep">
							<b className="mr-1.5 font-semibold" style={{ color: personColor(item.author) }}>
								{personName(item.author, item.isMine)}
							</b>
							{item.text}
							<span className="ml-1.5 text-xs text-muted-foreground">
								{timeAgo(item.createdAt)}
							</span>
						</li>
					))}
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
						className="min-h-11 flex-1 rounded-xl text-base"
					/>
					<Button type="submit" size="lg" disabled={!draft.trim() || reply.isPending}>
						등록
					</Button>
				</form>
			)}
			<footer className="mt-3 flex flex-wrap items-center gap-1.5">
				{chips.map((chip) => (
					<span
						key={chip.emoji}
						className={cn(
							"flex h-8 items-center gap-1 rounded-full bg-muted px-2.5 text-[13px] font-semibold",
							chip.emoji === mine &&
								"bg-secondary text-secondary-foreground ring-1 ring-primary/40",
						)}
					>
						<span className="text-base leading-none">{chip.emoji}</span>
						{chip.count}
					</span>
				))}
				<Popover open={reacting} onOpenChange={setReacting}>
					<PopoverTrigger
						render={
							<Button
								variant="ghost"
								className="h-11 px-2.5 text-muted-foreground"
								aria-label="반응 남기기"
							/>
						}
					>
						{mine ? <span className="text-base leading-none">{mine}</span> : <SmilePlusIcon />}
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
								className="grid size-10 place-items-center rounded-full text-xl aria-pressed:bg-secondary"
							>
								{emoji}
							</button>
						))}
					</PopoverContent>
				</Popover>
				<Button
					variant="ghost"
					className="ml-auto h-11 px-2 font-semibold text-primary"
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

/** Reaction counts with my pending change applied. */
function adjust(chips: Trace["reactions"], saved: string | null, next: string | null) {
	const counts = new Map(chips.map((chip) => [chip.emoji, chip.count]));
	if (saved !== next) {
		if (saved) counts.set(saved, (counts.get(saved) ?? 1) - 1);
		if (next) counts.set(next, (counts.get(next) ?? 0) + 1);
	}
	return [...counts].filter(([, count]) => count > 0).map(([emoji, count]) => ({ emoji, count }));
}
