import type { Library } from "@app/contract";
import { useActivity, useFlow } from "@stackflow/react";
import { BookRow, ProgressBar, useBookPages } from "@/entities/book";
import { shareInvite } from "@/entities/library";
import { personName, ReaderAvatar, useProfile } from "@/entities/profile";
import { timeAgo } from "@/shared/lib";
import {
	AvatarGroup,
	Button,
	InfiniteLoader,
	ListHeader,
	LoadState,
	ResultSection,
	Share2Icon,
	TextButton,
	useNotice,
} from "@/shared/ui";

/** 모임 홈 = 모임 서재: only the books this group chose to read together. */
export function GroupHome({ library, onImport }: { library: Library; onImport: () => void }) {
	const flow = useFlow();
	const { isActive } = useActivity();
	const notify = useNotice();
	const profile = useProfile();
	const books = useBookPages(library.id, "group", isActive);
	const rows = books.data?.pages.flatMap((page) => page.items) ?? [];
	const pick = () => flow.push("GroupBookPage", { libraryId: library.id });
	const invite = async () => {
		const result = await shareInvite(library, library.books);
		if (result === "copied") notify("초대 메시지와 링크를 복사했어요");
		if (result === "failed") notify("공유하지 못했어요. 초대 코드를 직접 알려주세요.", "critical");
	};
	return (
		<div className="flex flex-col gap-6 pt-2">
			<section className="mx-6 flex flex-col gap-3 rounded-xl bg-muted p-5">
				<span className="text-st10 font-semibold text-brand">교환독서 모임</span>
				<div className="flex items-center gap-3">
					<AvatarGroup>
						{library.members.slice(0, 5).map((person) => (
							<ReaderAvatar
								key={person.id}
								person={person}
								name={personName(person, person.id === profile.data?.id)}
								size="sm"
							/>
						))}
					</AvatarGroup>
					<span className="min-w-0 truncate text-t6 font-semibold text-strong">
						{library.members.length}명이 함께 읽어요
					</span>
				</div>
				<Button variant="weak" size="lg" onClick={invite}>
					<Share2Icon data-icon="inline-start" />
					같이 읽자고 초대하기
				</Button>
			</section>

			<section aria-labelledby="group-shelf-heading" className="flex flex-col">
				<div className="flex items-baseline justify-between px-6 pb-1">
					<ListHeader id="group-shelf-heading" className="px-0 pt-0 pb-0">
						모임 서재
					</ListHeader>
					{books.isSuccess && (
						<span className="text-t7 text-muted-foreground">{rows.length}권</span>
					)}
				</div>
				<p className="px-6 pb-2 text-t7 text-muted-foreground">
					모임에서 같이 읽기로 고른 책만 있어요
				</p>
				<LoadState pending={books.isPending} error={books.isError} retry={() => books.refetch()} />
				{books.isSuccess && rows.length === 0 && (
					<ResultSection
						title="아직 같이 읽을 책이 없어요"
						description="책을 고르면 모임 사람들 모두의 서재에 담겨요."
						action={{ label: "같이 읽을 책 고르기", onClick: pick }}
					/>
				)}
				{rows.map((book) => (
					<BookRow
						key={book.id}
						book={book}
						onClick={() => flow.push("BookPage", { bookId: book.id })}
						detail={
							<span className="flex items-center gap-2">
								<ProgressBar value={book.progress?.pct ?? 0} className="w-20 shrink-0" />
								<span className="truncate">
									{book.progress ? `${book.progress.pct}%` : "읽기 전"} · 흔적 {book.traceCount}
									{book.lastTraceAt ? ` · ${timeAgo(book.lastTraceAt)}` : ""}
								</span>
							</span>
						}
					/>
				))}
				<InfiniteLoader
					hasMore={isActive && books.hasNextPage}
					loading={books.isFetchingNextPage}
					error={books.isFetchNextPageError}
					loadMore={() => books.fetchNextPage()}
				/>
			</section>

			{rows.length > 0 && (
				<div className="flex flex-col items-center gap-3 px-6">
					<Button variant="outline" size="lg" className="w-full" onClick={pick}>
						같이 읽을 책 더 고르기
					</Button>
					<TextButton size="sm" onClick={onImport}>
						가진 전자책을 이 모임에 올리기
					</TextButton>
				</div>
			)}
		</div>
	);
}
