import { type ReactNode, useState } from "react";
import {
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetFooter,
	Button,
	CheckboxRow,
	LayersIcon,
	LightbulbIcon,
	MessageSquareTextIcon,
	PencilIcon,
	SmileIcon,
	UnderlineIcon,
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
		icon: <PencilIcon />,
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
							<CheckboxRow
								key={row.key}
								checked={draft[row.key]}
								onCheckedChange={(checked) => setDraft({ ...draft, [row.key]: checked })}
								title={row.title}
								description={row.description}
								leading={row.icon}
							/>
						))}
					</div>
					<p className="mt-2 flex items-center gap-1.5 text-t7 text-sub">
						<LightbulbIcon className="size-4 shrink-0" aria-hidden="true" />
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
