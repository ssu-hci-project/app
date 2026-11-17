import type { Bookmark, ReadingGroup } from "@app/contract";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow } from "@stackflow/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { orpc } from "@/shared/api";
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
	ChoiceGroup,
	ChoiceItem,
	Field,
	FieldDescription,
	FieldLabel,
	LoadState,
	MenuSheet,
	MenuSheetContent,
	MenuSheetItem,
	MobileScreen,
	Spinner,
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
						<EllipsisIcon />
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
						<h1 className="text-xl font-bold">
							{books.data?.find((book) => book.id === note.data.bookId)?.title ?? "독서 기록"} ·{" "}
							{note.data.page}쪽
						</h1>
						<p className="text-sm text-muted-foreground">
							{new Date(note.data.createdAt).toLocaleString("ko-KR")}
						</p>
					</div>
					{note.data.prompt && (
						<p className="text-sm font-medium text-muted-foreground">{note.data.prompt}</p>
					)}
					{note.data.quote && (
						<blockquote className="border-l-2 pl-4 text-base font-medium">
							{note.data.quote}
						</blockquote>
					)}
					<p className="whitespace-pre-wrap break-words text-base leading-6">{note.data.content}</p>
					{note.data.isMine && (
						<NoteActions
							key={`${note.data.id}:${note.data.visibility}:${note.data.groupId}`}
							note={note.data}
							groups={groups.data?.filter((group) => group.bookId === note.data.bookId) ?? []}
							groupsError={groups.isError}
							retryGroups={() => groups.refetch()}
						/>
					)}
					<Button
						variant="outline"
						onClick={() =>
							flow.push("ReadingPage", {
								bookId: note.data.bookId,
								page: String(note.data.page),
								groupId: note.data.groupId ?? undefined,
							})
						}
					>
						이 페이지로 돌아가기
					</Button>
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
			<Field>
				<FieldLabel htmlFor="note-visibility">공개 범위</FieldLabel>
				<Button
					id="note-visibility"
					variant="outline"
					size="lg"
					className="justify-between font-normal"
					aria-label="공개 범위 변경"
					onClick={() => {
						setSelected(note.groupId ?? "private");
						overlay.open("visibility");
					}}
				>
					{note.visibility === "private"
						? "나만 보기"
						: note.visibility === "legacy"
							? "기존 공개"
							: (groups.find((group) => group.id === note.groupId)?.name ?? "모임 공유")}
					<ChevronRightIcon className="text-muted-foreground" />
				</Button>
				<FieldDescription>
					{note.visibility === "private"
						? "직접 공유하기 전에는 다른 독자에게 보이지 않아요."
						: note.visibility === "group"
							? "이 모임의 참여자와 나누고 있어요."
							: "이전에 공용으로 남긴 기록이에요. 나만 보기로 바꿀 수 있어요."}
				</FieldDescription>
			</Field>
			<MenuSheet {...overlay.bind("menu")}>
				<MenuSheetContent title="기록 메뉴">
					<MenuSheetItem
						icon={<PencilIcon />}
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
					<MenuSheetItem
						icon={<Trash2Icon />}
						tone="critical"
						label="기록 삭제"
						onClick={() => {
							overlay.close();
							setRemoveOpen(true);
						}}
					/>
				</MenuSheetContent>
			</MenuSheet>
			<BottomSheet {...overlay.bind("visibility")}>
				<BottomSheetContent
					title="누구와 나눌까요?"
					description="이후 모임에 참여한 사람도 공유 기록을 볼 수 있어요."
				>
					<BottomSheetBody className="flex flex-col gap-4">
						{groups.length > 0 ? (
							<ChoiceGroup
								label="공개 범위"
								value={selected}
								onValueChange={setSelected}
								disabled={share.isPending}
							>
								<ChoiceItem value="private" label="나만 보기" description="내 기록에만 보관해요." />
								{groups.map((group) => (
									<ChoiceItem
										key={group.id}
										value={group.id}
										label={group.name}
										description="이 모임의 참여자와 나눠요."
									/>
								))}
							</ChoiceGroup>
						) : (
							<p>나만 보기로 보관해요.</p>
						)}
						{groupsError && (
							<Button variant="outline" onClick={retryGroups}>
								모임 다시 불러오기
							</Button>
						)}
						{!groups.length && !groupsError && (
							<p>공유할 모임이 없다면 먼저 함께 읽기 모임을 만들어보세요.</p>
						)}
						{share.isError && (
							<p className="text-destructive" role="alert">
								변경하지 못했어요. 기존 공개 범위는 그대로예요.
							</p>
						)}
						<Button
							size="lg"
							disabled={
								share.isPending || (selected === "private" && note.visibility === "private")
							}
							onClick={() =>
								share.mutate({
									noteId: note.id,
									groupId: selected === "private" ? null : selected,
								})
							}
						>
							{share.isPending && <Spinner data-icon="inline-start" />}
							{selected === "private" ? "나만 보기로 변경" : "이 모임에 공유"}
						</Button>
						<Button
							variant="ghost"
							onClick={() => {
								overlay.close();
								flow.push("GroupPage", { bookId: note.bookId });
							}}
						>
							함께 읽기 모임 보기
						</Button>
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheet>
			<AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>기록을 삭제할까요?</AlertDialogTitle>
						<AlertDialogDescription>
							삭제하면 내 기록과 공유한 모임에서 사라져요. 되돌릴 수 없어요.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>취소</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={remove.isPending}
							onClick={() => remove.mutate({ noteId: note.id })}
						>
							{remove.isPending && <Spinner data-icon="inline-start" />}
							기록 삭제
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
