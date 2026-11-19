import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BookCover } from "@/entities/book";
import { useCurrentLibrary } from "@/entities/library";
import { orpc } from "@/shared/api";
import {
	Alert,
	AlertDescription,
	Button,
	LoadState,
	MobileScreen,
	ResultSection,
	Spinner,
	useNotice,
} from "@/shared/ui";

/** 초대 링크로 들어온 화면: 모임과 함께 읽을 책을 미리 보고 참여합니다. */
export const InvitePage: ActivityComponentType<"InvitePage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const { select } = useCurrentLibrary();
	const preview = useQuery({
		...orpc.libraries.preview.queryOptions({ input: { code: params.code } }),
		retry: false,
	});
	const goHome = () => (isRoot ? flow.replace("HomePage", {}) : flow.pop());
	/** Into the group's only book, else its shelf on the home tab. */
	const enter = (libraryId: string, books: { id: string }[]) => {
		select(libraryId);
		const [only, ...rest] = books;
		if (only && !rest.length) flow.replace("BookPage", { bookId: only.id });
		else if (isRoot) flow.replace("HomePage", { tab: "home" });
		else flow.pop();
	};
	const join = useMutation(
		orpc.libraries.join.mutationOptions({
			onSuccess: (library) => {
				notify(`『${library.name}』에 참여했어요`, "positive");
				enter(library.id, library.books);
			},
		}),
	);
	const notFound = preview.error && "code" in preview.error && preview.error.code === "NOT_FOUND";
	return (
		<MobileScreen title="모임 초대" onBack={goHome}>
			{notFound ? (
				<ResultSection
					title="초대를 찾을 수 없어요"
					description="코드를 다시 확인하거나 초대한 사람에게 새 링크를 받아주세요."
					action={{ label: "홈으로", onClick: goHome }}
				/>
			) : (
				<LoadState
					pending={preview.isPending}
					error={preview.isError}
					retry={() => preview.refetch()}
				/>
			)}
			{preview.data && (
				<>
					<div className="flex flex-col gap-2">
						<p className="text-t7 font-semibold text-brand">
							{preview.data.books.length ? "같이 읽자는 초대가 왔어요" : "교환독서 모임"}
						</p>
						<h1 className="text-t3 leading-[1.35] font-bold text-strong break-keep">
							{preview.data.name}
						</h1>
						<p className="text-t6 text-muted-foreground">
							{preview.data.memberCount}명이 함께 읽어요
						</p>
					</div>
					{preview.data.books.length > 0 && (
						<section className="flex flex-col gap-3 rounded-xl bg-muted p-4">
							<span className="text-st10 font-semibold text-brand">
								같이 읽을 책 {preview.data.books.length}권
							</span>
							{preview.data.books.map((book) => (
								<div key={book.id} className="flex items-center gap-3">
									<BookCover book={book} size="sm" />
									<span className="flex min-w-0 flex-1 flex-col">
										<span className="line-clamp-2 text-t5 font-bold text-strong">{book.title}</span>
										{book.author && (
											<span className="truncate text-t7 text-muted-foreground">{book.author}</span>
										)}
									</span>
								</div>
							))}
						</section>
					)}
					<p className="text-t6 leading-[22px]">
						참여하면 이 모임 사람들이 남긴 밑줄과 메모를 볼 수 있고, 내가 남긴 흔적도 이 모임
						사람들에게 보여요.
					</p>
					{join.isError && (
						<Alert variant="destructive">
							<AlertDescription>아직 참여하지 않았어요. 다시 시도해주세요.</AlertDescription>
						</Alert>
					)}
					<Button
						size="lg"
						disabled={join.isPending}
						onClick={() =>
							preview.data.joined
								? enter(preview.data.id, preview.data.books)
								: join.mutate({ code: params.code })
						}
					>
						{join.isPending && <Spinner data-icon="inline-start" />}
						{preview.data.joined ? "같이 읽으러 가기" : "참여하고 같이 읽기"}
					</Button>
				</>
			)}
		</MobileScreen>
	);
};
