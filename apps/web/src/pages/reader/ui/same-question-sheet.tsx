import type { Trace } from "@app/contract";
import { useState } from "react";
import { personColor, personName } from "@/entities/profile";
import { cn, timeAgo } from "@/shared/lib";
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	InfiniteLoader,
	LightbulbIcon,
	useStepOverlay,
} from "@/shared/ui";
import { useReaderStore } from "../model/reader-store";

/** 같은 질문, 다른 생각: every answer to the question just answered, mine first. */
export function SameQuestionSheet({ traces }: { traces: Trace[] }) {
	const overlay = useStepOverlay();
	const answered = useReaderStore((state) => state.answered);
	const [window, setWindow] = useState({ key: answered?.q, count: 20 });
	const visibleCount = window.key === answered?.q ? window.count : 20;
	const answers = answered
		? traces
				.filter((trace) => trace.kind === "qa" && trace.q === answered.q)
				.sort(
					(a, b) => Number(b.isMine) - Number(a.isMine) || b.createdAt.localeCompare(a.createdAt),
				)
		: [];
	return (
		<BottomSheet {...overlay.bind("same", !!answered)}>
			<BottomSheetContent
				title="같은 질문, 다른 생각"
				description={answered ? `Q. ${answered.q}` : undefined}
			>
				<BottomSheetBody withFooter className="flex flex-col gap-2.5">
					{answers.slice(0, visibleCount).map((trace) => (
						<article
							key={trace.id}
							className={cn(
								"rounded-xl border px-4 py-3.5",
								trace.isMine && "border-secondary bg-secondary",
							)}
						>
							<p className="flex items-center gap-1.5 text-st9 font-semibold">
								<span
									className="size-2 rounded-full"
									style={{ backgroundColor: personColor(trace.author) }}
								/>
								{personName(trace.author, trace.isMine)}
								<span className="font-normal text-muted-foreground">
									{timeAgo(trace.createdAt)}
								</span>
							</p>
							<p className="mt-1.5 text-t6 leading-[23px] whitespace-pre-wrap break-keep">
								{trace.text}
							</p>
						</article>
					))}
					<InfiniteLoader
						hasMore={answers.length > visibleCount}
						loading={false}
						loadMore={() => setWindow({ key: answered?.q, count: visibleCount + 20 })}
					/>
					{answers.length < 2 && (
						<p className="text-t6 leading-[22px] text-muted-foreground">
							아직 같은 질문에 답한 독자가 없어요. 친구가 답하면 여기에 보여요.
						</p>
					)}
					<p className="mt-1 flex items-center gap-1.5 text-t7 text-muted-foreground">
						<LightbulbIcon className="size-4" aria-hidden="true" />
						최근에 남긴 순서예요
					</p>
				</BottomSheetBody>
				<BottomSheetFooter>
					<Button variant="secondary" size="lg" onClick={() => overlay.close()}>
						닫기
					</Button>
					<Button
						size="lg"
						disabled={!answered}
						onClick={() => {
							if (!answered) return;
							useReaderStore.setState({ memo: { passage: answered.passage, q: answered.q } });
							overlay.switchTo("memo");
						}}
					>
						생각 덧붙이기
					</Button>
				</BottomSheetFooter>
			</BottomSheetContent>
		</BottomSheet>
	);
}
