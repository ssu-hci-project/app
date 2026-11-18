import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { BookCover } from "@/entities/book";
import { shareInvite, useCurrentLibrary } from "@/entities/library";
import {
	Button,
	CircleCheckIcon,
	CopyIcon,
	LoadState,
	MobileScreen,
	ResultSection,
	Share2Icon,
	TextButton,
	useNotice,
} from "@/shared/ui";

/** 모임을 만든 직후: 고른 책과 초대 코드를 보여주고 같이 읽자고 보냅니다. */
export const GroupReadyPage: ActivityComponentType<"GroupReadyPage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const { libraries, select, query } = useCurrentLibrary();
	const group = libraries.find((entry) => entry.id === params.libraryId);
	const goHome = () => {
		if (group) select(group.id);
		if (isRoot) flow.replace("HomePage", { tab: "home" });
		else flow.pop();
	};
	const invite = async () => {
		if (!group) return;
		const result = await shareInvite(group, group.books);
		if (result === "copied") notify("초대 메시지와 링크를 복사했어요");
		if (result === "failed") notify("공유하지 못했어요. 초대 코드를 직접 알려주세요.", "critical");
	};
	return (
		<MobileScreen
			title="모임 만들기 완료"
			onBack={goHome}
			footer={
				group && (
					<div className="flex flex-col items-center gap-2">
						<Button size="lg" className="w-full" onClick={invite}>
							<Share2Icon data-icon="inline-start" />
							같이 읽자고 초대하기
						</Button>
						<TextButton size="sm" onClick={goHome}>
							모임 서재로 가기
						</TextButton>
					</div>
				)
			}
		>
			<LoadState pending={query.isPending} error={query.isError} retry={() => query.refetch()} />
			{query.isSuccess && !group && (
				<ResultSection
					title="모임을 찾을 수 없어요"
					action={{ label: "홈으로", onClick: goHome }}
				/>
			)}
			{group && (
				<>
					<div className="flex flex-col items-center gap-2 pt-4 text-center">
						<CircleCheckIcon className="size-12 text-brand" aria-hidden="true" />
						<h1 className="text-t3 leading-[1.35] font-bold text-strong break-keep">
							『{group.name}』 모임을 만들었어요
						</h1>
						<p className="text-t6 text-muted-foreground break-keep">
							초대받은 친구는 링크를 열고 바로 같은 책에 흔적을 남길 수 있어요
						</p>
					</div>
					<section className="flex flex-col gap-3 rounded-xl bg-muted p-4">
						<span className="text-st10 font-semibold text-brand">
							모임 서재 · {group.books.length}권
						</span>
						<div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
							{group.books.map((book) => (
								<div key={book.id} className="flex w-[76px] shrink-0 flex-col gap-1.5">
									<BookCover book={book} size="sm" />
									<span className="line-clamp-2 text-st10 leading-4 font-semibold">
										{book.title}
									</span>
								</div>
							))}
						</div>
					</section>
					<button
						type="button"
						onClick={async () => {
							try {
								await navigator.clipboard.writeText(group.inviteCode);
								notify("초대 코드를 복사했어요");
							} catch {
								notify("복사하지 못했어요. 코드를 직접 알려주세요.", "critical");
							}
						}}
						className="flex flex-col items-center gap-1 rounded-xl border border-input px-4 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
					>
						<span className="text-t7 text-sub">초대 코드</span>
						<span className="font-mono text-st2 font-bold tracking-[0.2em] text-strong">
							{group.inviteCode}
						</span>
						<span className="flex items-center gap-1 text-t7 text-sub">
							<CopyIcon className="size-4" aria-hidden="true" />
							눌러서 복사
						</span>
					</button>
				</>
			)}
		</MobileScreen>
	);
};
