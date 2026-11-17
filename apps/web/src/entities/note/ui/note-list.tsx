import type { LegacyBook as Book, Bookmark } from "@app/contract";
import { Badge, List, ListButton } from "@/shared/ui";

export function NoteList({
	notes,
	books = [],
	onSelect,
}: {
	notes: Bookmark[];
	books?: Book[];
	onSelect: (note: Bookmark) => void;
}) {
	return (
		<List>
			{notes.map((note) => (
				<ListButton
					key={note.id}
					onClick={() => onSelect(note)}
					title={
						<>
							{books.find((book) => book.id === note.bookId)?.title ?? "이 페이지의 생각"} ·{" "}
							{note.page}쪽
						</>
					}
					detail={
						<>
							<span className="line-clamp-2 whitespace-pre-wrap break-words">
								{note.quote || note.content}
							</span>
							<span className="mt-2 flex items-center gap-2">
								<Badge variant="outline">
									{note.visibility === "private"
										? "나만 보기"
										: note.visibility === "group"
											? "모임 공유"
											: "기존 공개"}
								</Badge>
								<span>{new Date(note.createdAt).toLocaleDateString("ko-KR")}</span>
							</span>
						</>
					}
				/>
			))}
		</List>
	);
}
