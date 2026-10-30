import "@seed-design/css/recipes/bottom-sheet.layered.css";
import type { Bookmark, ReadingGroup } from "@app/contract";
import {
	IconDot3HorizontalLine,
	IconPencilLine,
	IconTrashcanLine,
} from "@karrotmarket/react-monochrome-icon";
import { ActionButton, ResponsivePair, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
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
	FieldButton,
	FieldButtonValue,
	LoadState,
	MobileScreen,
	RadioSelectBoxItem,
	RadioSelectBoxRadiomark,
	RadioSelectBoxRoot,
	SwipeableMenuSheetContent,
	SwipeableMenuSheetGroup,
	SwipeableMenuSheetItem,
	SwipeableMenuSheetRoot,
	useNotice,
	useStepOverlay,
} from "@/shared/ui";

export const NotePage: ActivityComponentType<"NotePage"> = ({ params }) => {
	const note = useQuery(orpc.notes.get.queryOptions({ input: { noteId: params.noteId } }));
	const books = useQuery(orpc.reading.listBooks.queryOptions());
	const groups = useQuery(orpc.groups.list.queryOptions());
	const flow = useFlow();
	const { isRoot } = useActivity();
	const overlay = useStepOverlay();
	return (
		<MobileScreen
			title="기록"
			onBack={() =>
				isRoot ? flow.replace("HomePage", { section: "books", tab: "notes" }) : flow.pop()
			}
			action={
				note.data?.isMine && (
					<AppBarIconButton aria-label="기록 메뉴" onClick={() => overlay.open("menu")}>
						<IconDot3HorizontalLine />
					</AppBarIconButton>
				)
			}
		>
			<LoadState
				shape="article"
				pending={note.isPending}
				error={note.isError}
				retry={() => note.refetch()}
			/>
			{note.data && !note.isError && (
				<>
					<div>
						<Text as="h1" textStyle="t7Bold">
							{books.data?.find((book) => book.id === note.data.bookId)?.title ?? "독서 기록"} ·{" "}
							{note.data.page}쪽
						</Text>
						<Text color="fg.neutralMuted" textStyle="t3Regular">
							{new Date(note.data.createdAt).toLocaleString("ko-KR")}
						</Text>
					</div>
					{note.data.prompt && (
						<Text as="p" textStyle="t4Medium" color="fg.neutralMuted">
							{note.data.prompt}
						</Text>
					)}
					{note.data.quote && (
						<blockquote className="border-l-2 border-stroke-neutral-weak pl-x4">
							<Text textStyle="t5Medium">{note.data.quote}</Text>
						</blockquote>
					)}
					<Text as="p" textStyle="articleBody" className="whitespace-pre-wrap break-words">
						{note.data.content}
					</Text>
					{note.data.isMine && (
						<NoteActions
							key={`${note.data.id}:${note.data.visibility}:${note.data.groupId}`}
							note={note.data}
							groups={groups.data?.filter((group) => group.bookId === note.data.bookId) ?? []}
							groupsError={groups.isError}
							retryGroups={() => groups.refetch()}
						/>
					)}
					<ActionButton
						variant="neutralWeak"
						onClick={() =>
							flow.push("ReadingPage", {
								bookId: note.data.bookId,
								page: String(note.data.page),
								groupId: note.data.groupId ?? undefined,
							})
						}
					>
						이 페이지로 돌아가기
					</ActionButton>
				</>
			)}
		</MobileScreen>
	);
};

function NoteActions({
	note,
	groups,
	groupsError,
	retryGroups,
}: {
	note: Bookmark;
	groups: ReadingGroup[];
	groupsError: boolean;
	retryGroups: () => void;
}) {
	const overlay = useStepOverlay();
	const [removeOpen, setRemoveOpen] = useState(false);
	const [selected, setSelected] = useState(note.groupId ?? "private");
	const flow = useFlow();
	const { isRoot } = useActivity();
	const notify = useNotice();
	const share = useMutation(
		orpc.notes.setVisibility.mutationOptions({
			onSuccess: () => {
				overlay.close();
				notify(selected === "private" ? "나만 보기로 변경했어요" : "모임에 공유했어요", "positive");
			},
			onError: () => notify("공개 범위를 바꾸지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	const remove = useMutation(
		orpc.notes.remove.mutationOptions({
			onSuccess: () => {
				notify("기록을 삭제했어요");
				if (isRoot) flow.replace("HomePage", { section: "books", tab: "notes" });
				else flow.pop();
			},
			onError: () => notify("삭제하지 못했어요. 다시 시도해주세요.", "critical"),
		}),
	);
	return (
		<>
			<FieldButton
				label="공개 범위"
				description={
					note.visibility === "private"
						? "직접 공유하기 전에는 다른 독자에게 보이지 않아요."
						: note.visibility === "group"
							? "이 모임의 참여자와 나누고 있어요."
							: "이전에 공용으로 남긴 기록이에요. 나만 보기로 바꿀 수 있어요."
				}
				buttonProps={{
					onClick: () => {
						setSelected(note.groupId ?? "private");
						overlay.open("visibility");
					},
					"aria-label": "공개 범위 변경",
				}}
			>
				<FieldButtonValue>
					{note.visibility === "private"
						? "나만 보기"
						: note.visibility === "legacy"
							? "기존 공개"
							: (groups.find((group) => group.id === note.groupId)?.name ?? "모임 공유")}
				</FieldButtonValue>
			</FieldButton>
			<SwipeableMenuSheetRoot {...overlay.bind("menu")}>
				<SwipeableMenuSheetContent title="기록 메뉴">
					<SwipeableMenuSheetGroup>
						<SwipeableMenuSheetItem
							prefixIcon={<IconPencilLine />}
							label="내용 수정"
							onClick={() => {
								overlay.close();
								flow.replace("NoteEditorPage", {
									bookId: note.bookId,
									page: String(note.page),
									noteId: note.id,
								});
							}}
						/>
						<SwipeableMenuSheetItem
							prefixIcon={<IconTrashcanLine />}
							tone="critical"
							label="기록 삭제"
							onClick={() => {
								overlay.close();
								setRemoveOpen(true);
							}}
						/>
					</SwipeableMenuSheetGroup>
				</SwipeableMenuSheetContent>
			</SwipeableMenuSheetRoot>
			<BottomSheetRoot {...overlay.bind("visibility")}>
				<BottomSheetContent
					title="누구와 나눌까요?"
					description="이후 모임에 참여한 사람도 공유 기록을 볼 수 있어요."
				>
					<BottomSheetBody>
						<div className="flex max-h-[65dvh] flex-col gap-x4 overflow-y-auto pb-x6">
							{groups.length > 0 ? (
								<RadioSelectBoxRoot
									label="공개 범위"
									value={selected}
									onValueChange={setSelected}
									disabled={share.isPending}
								>
									<RadioSelectBoxItem
										value="private"
										label="나만 보기"
										description="내 기록에만 보관해요."
										suffix={<RadioSelectBoxRadiomark />}
									/>
									{groups.map((group) => (
										<RadioSelectBoxItem
											key={group.id}
											value={group.id}
											label={group.name}
											description="이 모임의 참여자와 나눠요."
											suffix={<RadioSelectBoxRadiomark />}
										/>
									))}
								</RadioSelectBoxRoot>
							) : (
								<Text>나만 보기로 보관해요.</Text>
							)}
							{groupsError && (
								<ActionButton variant="neutralWeak" onClick={retryGroups}>
									모임 다시 불러오기
								</ActionButton>
							)}
							{!groups.length && !groupsError && (
								<Text>공유할 모임이 없다면 먼저 함께 읽기 모임을 만들어보세요.</Text>
							)}
							{share.isError && (
								<Text color="fg.critical" role="alert">
									변경하지 못했어요. 기존 공개 범위는 그대로예요.
								</Text>
							)}
							<ActionButton
								loading={share.isPending}
								disabled={selected === "private" && note.visibility === "private"}
								variant={selected === "private" ? "neutralSolid" : "brandSolid"}
								onClick={() =>
									share.mutate({
										noteId: note.id,
										groupId: selected === "private" ? null : selected,
									})
								}
							>
								{selected === "private" ? "나만 보기로 변경" : "이 모임에 공유"}
							</ActionButton>
							<ActionButton
								variant="ghost"
								onClick={() => {
									overlay.close();
									flow.push("GroupPage", { bookId: note.bookId });
								}}
							>
								함께 읽기 모임 보기
							</ActionButton>
						</div>
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheetRoot>
			<AlertDialogRoot open={removeOpen} onOpenChange={setRemoveOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>기록을 삭제할까요?</AlertDialogTitle>
						<AlertDialogDescription>
							삭제하면 내 기록과 공유한 모임에서 사라져요. 되돌릴 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<ResponsivePair gap="x2">
							<AlertDialogAction variant="neutralWeak">취소</AlertDialogAction>
							<AlertDialogAction
								variant="criticalSolid"
								loading={remove.isPending}
								onClick={(event) => {
									event.preventDefault();
									remove.mutate({ noteId: note.id });
								}}
							>
								기록 삭제
							</AlertDialogAction>
						</ResponsivePair>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialogRoot>
		</>
	);
}
