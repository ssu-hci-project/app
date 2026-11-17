import type { LegacyBook as Book, ReadingGroup } from "@app/contract";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { EllipsisIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { bookByline } from "@/entities/book";
import { GroupCreate } from "@/features/group/create";
import { orpc } from "@/shared/api";
import { cn } from "@/shared/lib";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AppBarIconButton,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	Button,
	FloatingActionButton,
	List,
	ListButton,
	ListHeader,
	LoadState,
	MenuSheet,
	MenuSheetContent,
	MenuSheetItem,
	MobileScreen,
	Spinner,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";

export const GroupPage: ActivityComponentType<"GroupPage"> = ({ params }) => {
	const flow = useFlow();
	const { isRoot } = useActivity();
	const overlay = useStepOverlay();
	const groups = useQuery(orpc.groups.list.queryOptions());
	const book = useQuery(orpc.reading.getBook.queryOptions({ input: { bookId: params.bookId } }));
	const group = groups.data?.find((item) => item.id === params.groupId);
	const bookGroups = groups.data?.filter((item) => item.bookId === params.bookId) ?? [];
	return (
		<MobileScreen
			title={group?.name ?? "함께 읽기 모임"}
			onBack={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
			action={
				group && (
					<AppBarIconButton aria-label="모임 메뉴" onClick={() => overlay.open("menu")}>
						<EllipsisIcon />
					</AppBarIconButton>
				)
			}
			fab={
				!params.groupId &&
				book.data && (
					<FloatingActionButton
						icon={<PlusIcon />}
						label="모임 만들기"
						onClick={() => overlay.open("create")}
					/>
				)
			}
		>
			<LoadState
				pending={book.isPending || groups.isPending}
				error={book.isError || groups.isError}
				retry={() => {
					book.refetch();
					groups.refetch();
				}}
			/>
			{book.data && (
				<div>
					<h1 className="text-xl font-bold">{book.data.book.title}</h1>
					<p className="text-sm text-muted-foreground">{bookByline(book.data.book)}</p>
				</div>
			)}
			{group && book.data ? (
				<GroupDetail group={group} book={book.data.book} />
			) : !params.groupId && book.data ? (
				<BookGroups book={book.data.book} groups={bookGroups} loaded={groups.isSuccess} />
			) : (
				params.groupId &&
				groups.isSuccess && <p>이 모임에 참여 중이지 않아요. 초대 링크로 참여해주세요.</p>
			)}
		</MobileScreen>
	);
};

function GroupDetail({ group, book }: { group: ReadingGroup; book: Book }) {
	const flow = useFlow();
	const overlay = useStepOverlay();
	const notify = useNotice();
	const [leaving, setLeaving] = useState(false);
	const leave = useMutation(
		orpc.groups.leave.mutationOptions({
			onSuccess: () => {
				notify("모임에서 나왔어요. 내 기록은 나만 보기로 보관해요.");
				flow.replace("HomePage", {});
			},
			onError: () => notify("모임에서 나가지 못했어요", "critical"),
		}),
	);
	const inviteUrl = new URL(`/invite/${group.inviteCode}`, window.location.origin).href;
	// 예전 모임은 긴 코드라 말로 전하기 어려워 링크만 보내요.
	const shortCode = group.inviteCode.length <= 12;
	const sendInvite = async () => {
		const text = shortCode
			? `「${book.title}」 함께 읽어요. 초대 코드: ${group.inviteCode}`
			: `「${book.title}」 함께 읽어요.`;
		if (navigator.share) {
			try {
				await navigator.share({ title: group.name, text, url: inviteUrl });
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") return;
			}
		}
		try {
			await navigator.clipboard.writeText(inviteUrl);
			notify("초대 링크를 복사했어요", "positive");
		} catch {
			notify("링크를 보내지 못했어요. 아래 초대 코드를 직접 알려주세요.", "critical");
		}
	};
	return (
		<>
			<p>
				{group.memberCount}명이 각자의 속도로 읽고 있어요. 기록 작성이나 완독은 필수가 아니에요.
			</p>
			<Button
				size="lg"
				onClick={() => flow.push("ReadingPage", { bookId: group.bookId, groupId: group.id })}
			>
				모임과 이어 읽기
			</Button>
			{group.unreadPages.length > 0 && (
				<section className="-mx-4">
					<ListHeader>새로운 생각이 있는 쪽</ListHeader>
					<List>
						{group.unreadPages.map((page) => (
							<ListButton
								key={page}
								title={`${page}쪽으로 이동`}
								detail="내용은 직접 열어볼 때 보여요"
								onClick={() =>
									flow.push("ReadingPage", {
										bookId: group.bookId,
										groupId: group.id,
										page: String(page),
									})
								}
							/>
						))}
					</List>
				</section>
			)}
			<section className="flex flex-col gap-3">
				<h2 className="text-lg font-bold">함께 읽을 사람 초대</h2>
				<p className="text-sm text-muted-foreground">
					초대받은 사람은 모임 정보를 확인한 뒤 직접 참여해요.
				</p>
				<div className="flex flex-col gap-1 rounded-md bg-muted px-4 py-3">
					<p className="text-sm text-muted-foreground">초대 코드</p>
					<p
						className={cn(
							"select-all break-all tabular-nums",
							shortCode ? "text-2xl font-bold tracking-[0.18em]" : "text-sm",
						)}
					>
						{group.inviteCode}
					</p>
				</div>
				<Button variant="outline" onClick={sendInvite}>
					초대 링크 보내기
				</Button>
			</section>
			<MenuSheet {...overlay.bind("menu")}>
				<MenuSheetContent title="모임 메뉴">
					<MenuSheetItem
						tone="critical"
						label="모임에서 나가기"
						description="공유한 내 기록은 나만 보기로 바뀌어요"
						onClick={() => {
							overlay.close();
							setLeaving(true);
						}}
					/>
				</MenuSheetContent>
			</MenuSheet>
			<AlertDialog open={leaving} onOpenChange={setLeaving}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>모임에서 나갈까요?</AlertDialogTitle>
						<AlertDialogDescription>
							공유한 내 기록은 나만 보기로 바뀌어요. 모임의 다른 기록은 더 이상 볼 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={leave.isPending}
							onClick={() => leave.mutate({ groupId: group.id })}
						>
							{leave.isPending && <Spinner data-icon="inline-start" />}
							모임에서 나가기
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function BookGroups({
	book,
	groups,
	loaded,
}: {
	book: Book;
	groups: ReadingGroup[];
	loaded: boolean;
}) {
	const { replaceStep } = useStepFlow("GroupPage");
	const overlay = useStepOverlay();
	return (
		<>
			<section className="-mx-4">
				<ListHeader>이 책으로 참여 중인 모임</ListHeader>
				{groups.length > 0 ? (
					<List>
						{groups.map((item) => (
							<ListButton
								key={item.id}
								title={item.name}
								detail={`${item.memberCount}명이 함께 읽고 있어요`}
								onClick={() => replaceStep({ bookId: book.id, groupId: item.id })}
							/>
						))}
					</List>
				) : (
					loaded && (
						<p className="px-4 text-muted-foreground">
							아직 참여 중인 모임이 없어요. 오른쪽 아래 버튼으로 만들 수 있어요.
						</p>
					)
				)}
			</section>
			<BottomSheet {...overlay.bind("create")}>
				<BottomSheetContent title="새 함께 읽기 모임">
					<BottomSheetBody>
						<GroupCreate
							books={[book]}
							defaultBookId={book.id}
							onCreated={(saved) => {
								overlay.close();
								replaceStep({ bookId: saved.bookId, groupId: saved.id });
							}}
						/>
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheet>
		</>
	);
}
