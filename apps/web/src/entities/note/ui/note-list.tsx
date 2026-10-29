import type { Book, Bookmark } from "@app/contract";
import { Badge, List } from "@seed-design/react";

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
		<List.Root as="div">
			{notes.map((note) => (
				<List.Item key={note.id} asChild>
					<button
						type="button"
						onClick={() => onSelect(note)}
						className="w-full cursor-pointer text-left"
					>
						<List.Content>
							<List.Title>
								{books.find((book) => book.id === note.bookId)?.title ?? "이 페이지의 생각"} ·{" "}
								{note.page}쪽
							</List.Title>
							<List.Detail>
								<span className="line-clamp-2 whitespace-pre-wrap break-words">
									{note.quote || note.content}
								</span>
								<span className="mt-x2 flex items-center gap-x2">
									<Badge.Root tone="neutral" variant="weak">
										<Badge.Label>
											{note.visibility === "private"
												? "나만 보기"
												: note.visibility === "group"
													? "모임 공유"
													: "기존 공개"}
										</Badge.Label>
									</Badge.Root>
									<span>{new Date(note.createdAt).toLocaleDateString("ko-KR")}</span>
								</span>
							</List.Detail>
						</List.Content>
					</button>
				</List.Item>
			))}
		</List.Root>
	);
}
