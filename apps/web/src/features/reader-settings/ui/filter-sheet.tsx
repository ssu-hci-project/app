import {
	CheckIcon,
	LayersIcon,
	LightbulbIcon,
	MessageSquareTextIcon,
	PenLineIcon,
	SmileIcon,
	UnderlineIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { cn } from "@/shared/lib";
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
} from "@/shared/ui";
import { someHidden, type TraceFilters, useReaderSettings } from "../model/reader-settings";

const rows: { key: keyof TraceFilters; icon: ReactNode; title: string; description: string }[] = [
	{
		key: "underline",
		icon: <UnderlineIcon />,
		title: "밑줄",
		description: "독자마다 다른 색 밑줄",
	},
	{
		key: "memo",
		icon: <MessageSquareTextIcon />,
		title: "메모와 질문",
		description: "구절 끝 말풍선으로 표시돼요",
	},
	{
		key: "draw",
		icon: <PenLineIcon />,
		title: "꾸미기",
		description: "손그림 · 메모지 · 테이프 · 스티커",
	},
	{ key: "react", icon: <SmileIcon />, title: "반응", description: "이모지로 남긴 가벼운 반응" },
];

/** Which kinds of traces the reader shows. Applies to every book on this device. */
export function FilterSheet({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { filters, setFilters } = useReaderSettings();
	const [draft, setDraft] = useState(filters);
	return (
		<BottomSheet
			open={open}
			onOpenChange={(next) => {
				if (next) setDraft(filters);
				onOpenChange(next);
			}}
		>
			<BottomSheetContent
				title={someHidden(draft) ? "흔적 일부 숨김" : "흔적 종류"}
				description="보고 싶은 흔적만 골라 보세요. 모든 책에 적용돼요."
			>
				<BottomSheetBody withFooter className="pt-2">
					<div className="flex flex-col">
						{rows.map((row) => (
							<button
								key={row.key}
								type="button"
								aria-pressed={draft[row.key]}
								onClick={() => setDraft({ ...draft, [row.key]: !draft[row.key] })}
								className="flex min-h-15 items-center gap-3.5 rounded-lg py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							>
								<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-5">
									{row.icon}
								</span>
								<span className="flex min-w-0 flex-1 flex-col">
									<span className="text-[15px] leading-[22px] font-semibold">{row.title}</span>
									<span className="text-[13px] leading-[19px] text-muted-foreground">
										{row.description}
									</span>
								</span>
								<span
									aria-hidden="true"
									className={cn(
										"grid size-6 shrink-0 place-items-center rounded-md border-2 border-input text-primary-foreground",
										draft[row.key] && "border-primary bg-primary",
									)}
								>
									{draft[row.key] && <CheckIcon className="size-4" strokeWidth={3} />}
								</span>
							</button>
						))}
					</div>
					<p className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
						<LightbulbIcon className="size-4" aria-hidden="true" />
						하나도 고르지 않으면 본문만 보여요
					</p>
				</BottomSheetBody>
				<BottomSheetFooter>
					<Button
						size="lg"
						onClick={() => {
							setFilters(draft);
							onOpenChange(false);
						}}
					>
						완료
					</Button>
				</BottomSheetFooter>
			</BottomSheetContent>
		</BottomSheet>
	);
}

/** Filter icon with a dot when some kinds are hidden (no count badge). */
export function FilterIcon() {
	const hidden = useReaderSettings((state) => someHidden(state.filters));
	return (
		<span className="relative">
			<LayersIcon />
			{hidden && (
				<span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary ring-2 ring-card" />
			)}
			<span className="sr-only">{hidden ? "흔적 일부 숨김" : ""}</span>
		</span>
	);
}
