import "@seed-design/css/recipes/bottom-sheet.layered.css";
import "@seed-design/css/recipes/text-input.layered.css";
import "@seed-design/css/recipes/field.layered.css";
import "@seed-design/css/recipes/field-label.layered.css";
import type { Book, ReadingGroup } from "@app/contract";
import { IconDot3HorizontalLine, IconPlusLine } from "@karrotmarket/react-monochrome-icon";
import { ActionButton, List, ListHeader, ResponsivePair, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { bookByline } from "@/entities/book";
import { GroupCreate } from "@/features/group/create";
import { orpc } from "@/shared/api";
import { cn } from "@/shared/lib";
import {
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogRoot,
	AlertDialogTitle,
	AppBarIconButton,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetRoot,
	FloatingActionButton,
	LoadState,
	MobileScreen,
	SwipeableMenuSheetContent,
	SwipeableMenuSheetGroup,
	SwipeableMenuSheetItem,
	SwipeableMenuSheetRoot,
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
						<IconDot3HorizontalLine />
					</AppBarIconButton>
				)
			}
			fab={
				!params.groupId &&
				book.data && (
					<FloatingActionButton
						extended
						icon={<IconPlusLine />}
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
					<Text as="h1" textStyle="t7Bold">
						{book.data.book.title}
					</Text>
					<Text as="p" color="fg.neutralMuted" textStyle="t3Regular">
						{bookByline(book.data.book)}
					</Text>
				</div>
			)}
			{group && book.data ? (
				<GroupDetail group={group} book={book.data.book} />
			) : !params.groupId && book.data ? (
				<BookGroups book={book.data.book} groups={bookGroups} loaded={groups.isSuccess} />
			) : (
				params.groupId &&
				groups.isSuccess && <Text>이 모임에 참여 중이지 않아요. 초대 링크로 참여해주세요.</Text>
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
			<Text>
				{group.memberCount}명이 각자의 속도로 읽고 있어요. 기록 작성이나 완독은 필수가 아니에요.
			</Text>
			<ActionButton
				variant="brandSolid"
				onClick={() => flow.push("ReadingPage", { bookId: group.bookId, groupId: group.id })}
			>
				모임과 이어 읽기
			</ActionButton>
			{group.unreadPages.length > 0 && (
				<section>
					<ListHeader as="h2">새로운 생각이 있는 쪽</ListHeader>
					<List.Root as="div">
						{group.unreadPages.map((page) => (
							<List.Item key={page} asChild>
								<button
									type="button"
									className="w-full text-left"
									onClick={() =>
										flow.push("ReadingPage", {
											bookId: group.bookId,
											groupId: group.id,
											page: String(page),
										})
									}
								>
									<List.Content>
										<List.Title>{page}쪽으로 이동</List.Title>
										<List.Detail>내용은 직접 열어볼 때 보여요</List.Detail>
									</List.Content>
								</button>
							</List.Item>
						))}
					</List.Root>
				</section>
			)}
			<section className="flex flex-col gap-x3">
				<Text as="h2" textStyle="t6Bold">
					함께 읽을 사람 초대
				</Text>
				<Text textStyle="t4Regular" color="fg.neutralMuted">
					초대받은 사람은 모임 정보를 확인한 뒤 직접 참여해요.
				</Text>
				<div className="flex flex-col gap-x1 rounded-r2 bg-bg-neutral-weak px-x4 py-x3">
					<Text textStyle="t3Regular" color="fg.neutralMuted">
						초대 코드
					</Text>
					<Text
						as="p"
						textStyle={shortCode ? "t8Bold" : "t3Regular"}
						className={cn("select-all break-all tabular-nums", shortCode && "tracking-[0.18em]")}
					>
						{group.inviteCode}
					</Text>
				</div>
				<ActionButton variant="neutralWeak" onClick={sendInvite}>
					초대 링크 보내기
				</ActionButton>
			</section>
			<SwipeableMenuSheetRoot {...overlay.bind("menu")}>
				<SwipeableMenuSheetContent title="모임 메뉴">
					<SwipeableMenuSheetGroup>
						<SwipeableMenuSheetItem
							tone="critical"
							label="모임에서 나가기"
							description="공유한 내 기록은 나만 보기로 바뀌어요"
							onClick={() => {
								overlay.close();
								setLeaving(true);
							}}
						/>
					</SwipeableMenuSheetGroup>
				</SwipeableMenuSheetContent>
			</SwipeableMenuSheetRoot>
			<AlertDialogRoot open={leaving} onOpenChange={setLeaving}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>모임에서 나갈까요?</AlertDialogTitle>
						<AlertDialogDescription>
							공유한 내 기록은 나만 보기로 바뀌어요. 모임의 다른 기록은 더 이상 볼 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<ResponsivePair gap="x2">
							<AlertDialogAction variant="neutralWeak">취소</AlertDialogAction>
							<AlertDialogAction
								variant="criticalSolid"
								loading={leave.isPending}
								onClick={(event) => {
									event.preventDefault();
									leave.mutate({ groupId: group.id });
								}}
							>
								모임에서 나가기
							</AlertDialogAction>
						</ResponsivePair>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogRoot>
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
			<section>
				<ListHeader as="h2">이 책으로 참여 중인 모임</ListHeader>
				{groups.length > 0 ? (
					<List.Root as="div">
						{groups.map((item) => (
							<List.Item key={item.id} asChild>
								<button
									type="button"
									className="w-full text-left"
									onClick={() => replaceStep({ bookId: book.id, groupId: item.id })}
								>
									<List.Content>
										<List.Title>{item.name}</List.Title>
										<List.Detail>{item.memberCount}명이 함께 읽고 있어요</List.Detail>
									</List.Content>
								</button>
							</List.Item>
						))}
					</List.Root>
				) : (
					loaded && (
						<Text color="fg.neutralMuted">
							아직 참여 중인 모임이 없어요. 오른쪽 아래 버튼으로 만들 수 있어요.
						</Text>
					)
				)}
			</section>
			<BottomSheetRoot {...overlay.bind("create")}>
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
			</BottomSheetRoot>
		</>
	);
}
