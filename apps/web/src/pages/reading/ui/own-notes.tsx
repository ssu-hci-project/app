import { ListHeader, Text } from "@seed-design/react";
import { useFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { NoteList } from "@/entities/note";
import { orpc } from "@/shared/api";
import { LoadState } from "@/shared/ui";

export function OwnNotes({ bookId, page }: { bookId: string; page: number }) {
	const flow = useFlow();
	const query = useQuery(orpc.notes.listMine.queryOptions());
	const notes = query.data?.filter((note) => note.bookId === bookId && note.page === page) ?? [];
	return (
		<section>
			<ListHeader as="h2">{page}쪽의 내 기록</ListHeader>
			<LoadState pending={query.isPending} error={query.isError} retry={() => query.refetch()} />
			{notes.length > 0 ? (
				<NoteList notes={notes} onSelect={(note) => flow.push("NotePage", { noteId: note.id })} />
			) : (
				query.isSuccess && (
					<Text as="p" color="fg.neutralMuted">
						아직 기록이 없어요. 한 줄이어도 괜찮아요.
					</Text>
				)
			)}
		</section>
	);
}
