import { ActionButton, SegmentedControl } from "@seed-design/react";
import { useQuery } from "@tanstack/react-query";
import { NoteList } from "@/entities/note";
import { orpc } from "@/shared/api";
import { Callout, LoadState, ResultSection } from "@/shared/ui";

export function Archive({
	filter,
	onFilter,
	onSelect,
	onBrowse,
}: {
	filter: string;
	onFilter: (value: string) => void;
	onSelect: (noteId: string) => void;
	/** 빈 상태에서 기록을 강요하지 않고 책으로 돌아가게 합니다. */
	onBrowse: () => void;
}) {
	const notes = useQuery(orpc.notes.listMine.queryOptions());
	const books = useQuery(orpc.reading.listBooks.queryOptions());
	const items =
		notes.data?.filter(
			(note) =>
				filter === "all" ||
				(filter === "private" ? note.visibility === "private" : note.visibility !== "private"),
		) ?? [];
	const download = () => {
		const blob = new Blob(
			[
				JSON.stringify(
					{ exportedAt: new Date().toISOString(), books: books.data, records: notes.data },
					null,
					2,
				),
			],
			{ type: "application/json" },
		);
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "reading-records.json";
		anchor.click();
		window.setTimeout(() => URL.revokeObjectURL(url), 1000);
	};
	return (
		<div className="flex flex-col gap-x4 px-x4 py-x5">
			<SegmentedControl.Root
				value={filter}
				onValueChange={onFilter}
				aria-label="내 기록 공개 상태 필터"
			>
				{[
					{ value: "all", label: "전체" },
					{ value: "private", label: "나만 보기" },
					{ value: "shared", label: "공유" },
				].map(({ value, label }) => (
					<SegmentedControl.Item key={value} value={value}>
						<SegmentedControl.ItemHiddenInput />
						{label}
					</SegmentedControl.Item>
				))}
				<SegmentedControl.Indicator />
			</SegmentedControl.Root>
			<LoadState pending={notes.isPending} error={notes.isError} retry={() => notes.refetch()} />
			{notes.isSuccess &&
				(items.length ? (
					<NoteList notes={items} books={books.data} onSelect={(note) => onSelect(note.id)} />
				) : (
					<ResultSection
						size="medium"
						title="아직 이곳에 기록이 없어요"
						description="책을 읽다 머문 장면이 있으면 그 쪽에서 남길 수 있어요."
						secondaryActionProps={{ children: "책장에서 책 열기", onClick: onBrowse }}
					/>
				))}
			<Callout
				tone="warning"
				title="보관"
				description="이 브라우저에만 연결된 기록이에요. 쿠키가 지워지면 다시 찾기 어려우니 중요한 기록은 파일로 보관해주세요."
			/>
			<ActionButton
				variant="neutralWeak"
				disabled={!notes.isSuccess || notes.data.length === 0}
				onClick={download}
			>
				내 기록 파일로 보관
			</ActionButton>
		</div>
	);
}
