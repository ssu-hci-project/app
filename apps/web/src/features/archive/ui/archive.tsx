import { useQuery } from "@tanstack/react-query";
import { NoteList } from "@/entities/note";
import { orpc } from "@/shared/api";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	LoadState,
	ResultSection,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@/shared/ui";

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
		<div className="flex flex-col gap-4 px-4 py-5">
			<Tabs value={filter} onValueChange={(value) => onFilter(value as string)}>
				<TabsList aria-label="내 기록 공개 상태 필터" className="h-10! w-full">
					{[
						{ value: "all", label: "전체" },
						{ value: "private", label: "나만 보기" },
						{ value: "shared", label: "공유" },
					].map(({ value, label }) => (
						<TabsTrigger key={value} value={value}>
							{label}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>
			<LoadState pending={notes.isPending} error={notes.isError} retry={() => notes.refetch()} />
			{notes.isSuccess &&
				(items.length ? (
					<NoteList notes={items} books={books.data} onSelect={(note) => onSelect(note.id)} />
				) : (
					<ResultSection
						title="아직 이곳에 기록이 없어요"
						description="책을 읽다 머문 장면이 있으면 그 쪽에서 남길 수 있어요."
						secondaryAction={{ label: "책장에서 책 열기", onClick: onBrowse }}
					/>
				))}
			<Alert className="border-warning/40 bg-warning/10">
				<AlertTitle>보관</AlertTitle>
				<AlertDescription>
					이 브라우저에만 연결된 기록이에요. 쿠키가 지워지면 다시 찾기 어려우니 중요한 기록은 파일로
					보관해주세요.
				</AlertDescription>
			</Alert>
			<Button
				variant="outline"
				disabled={!notes.isSuccess || notes.data.length === 0}
				onClick={download}
			>
				내 기록 파일로 보관
			</Button>
		</div>
	);
}
