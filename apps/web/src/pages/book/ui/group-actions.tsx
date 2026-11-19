import type { Book, Library } from "@app/contract";
import { useFlow } from "@stackflow/react";
import { useMutation } from "@tanstack/react-query";
import { libraryName, useCurrentLibrary } from "@/entities/library";
import { orpc } from "@/shared/api";
import { CardButton, useNotice } from "@/shared/ui";

/**
 * 내 서재에서는 이 책을 읽는 모임과 "이 책으로 모임 만들기", 모임에서는 모임 서재에 담기를 보여줍니다.
 */
export function GroupActions({ library, book }: { library: Library; book: Book }) {
	const flow = useFlow();
	const { select } = useCurrentLibrary();
	const notify = useNotice();
	const shelve = useMutation(
		orpc.libraries.addBooks.mutationOptions({
			onSuccess: () => notify("모임 서재에 담았어요", "positive"),
			onError: () => notify("담지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	return (
		<section className="mx-6 mt-4 flex flex-col gap-2">
			{library.personal ? (
				<>
					{book.readIn.map((group) => (
						<CardButton
							key={group.id}
							onClick={() => select(group.id)}
							className="flex items-center gap-3"
						>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="text-st10 font-semibold text-brand">교환독서 중</span>
								<span className="truncate text-t6 font-semibold text-strong">
									『{group.name}』에서 함께 읽고 있어요
								</span>
							</span>
							<span className="shrink-0 text-t7 text-sub">모임으로 보기</span>
						</CardButton>
					))}
					{!book.libraryId && (
						<CardButton
							onClick={() => flow.push("GroupNewPage", { step: "name", books: book.id })}
							className="flex items-center gap-3"
						>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="text-st10 font-semibold text-brand">교환독서</span>
								<span className="text-t6 font-semibold text-strong break-keep">
									이 책으로 모임 만들고 친구 초대하기
								</span>
							</span>
						</CardButton>
					)}
				</>
			) : library.books.some((entry) => entry.id === book.id) ? (
				<p className="rounded-xl bg-secondary px-4 py-3 text-t7 font-semibold text-brand">
					『{libraryName(library)}』 모임 서재에 있는 책이에요
				</p>
			) : (
				<CardButton
					disabled={shelve.isPending}
					onClick={() => shelve.mutate({ libraryId: library.id, bookIds: [book.id] })}
					className="flex items-center gap-3"
				>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="text-st10 font-semibold text-brand">모임 서재</span>
						<span className="text-t6 font-semibold text-strong break-keep">
							이 책을 『{library.name}』에서 같이 읽기
						</span>
					</span>
				</CardButton>
			)}
		</section>
	);
}
