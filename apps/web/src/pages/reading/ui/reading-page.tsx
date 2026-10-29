import "@seed-design/css/recipes/bottom-sheet.layered.css";
import "@seed-design/css/recipes/text-input.layered.css";
import "@seed-design/css/recipes/field.layered.css";
import "@seed-design/css/recipes/field-label.layered.css";
import type { Book, ReadingGroup } from "@app/contract";
import { ActionButton, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetRoot,
	FieldButton,
	FieldButtonValue,
	LoadState,
	MobileScreen,
	PageBanner,
	PageBannerButton,
	RadioSelectBoxItem,
	RadioSelectBoxRadiomark,
	RadioSelectBoxRoot,
} from "@/shared/ui";
import { OwnNotes } from "./own-notes";
import { PageBookmarks } from "./page-bookmarks";
import { PageNavigator } from "./page-navigator";

export const ReadingPage: ActivityComponentType<"ReadingPage"> = ({ params }) => {
	const book = useQuery(orpc.reading.getBook.queryOptions({ input: { bookId: params.bookId } }));
	const flow = useFlow();
	const { isRoot } = useActivity();
	const groupId =
		params.groupId === "private"
			? undefined
			: (params.groupId ?? book.data?.lastGroupId ?? undefined);
	return (
		<MobileScreen
			title={book.data?.book.title ?? "책 읽기"}
			onBack={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
		>
			<LoadState pending={book.isPending} error={book.isError} retry={() => book.refetch()} />
			{book.data && (
				<ReadingContent
					key={`${params.bookId}:${params.page ?? "resume"}:${groupId ?? "private"}`}
					book={book.data.book}
					page={Number(params.page ?? book.data.currentPage)}
					groupId={groupId}
				/>
			)}
		</MobileScreen>
	);
};

function ReadingContent({ book, page, groupId }: { book: Book; page: number; groupId?: string }) {
	const flow = useFlow();
	const { replaceStep } = useStepFlow("ReadingPage");
	const [open, setOpen] = useState(false);
	const [pickGroup, setPickGroup] = useState(false);
	const groups = useQuery(orpc.groups.list.queryOptions());
	const group = groups.data?.find((item) => item.id === groupId);
	const validPage = Number.isInteger(page) && page > 0 && page <= book.pageCount;
	const selectGroup = (selected: string) => {
		setPickGroup(false);
		replaceStep({ bookId: book.id, page: String(page), groupId: selected });
	};
	return (
		<>
			{group && group.unreadCount > 0 && (
				<PageBanner
					tone="neutral"
					variant="weak"
					description="이 모임에 새로운 생각이 있어요."
					suffix={
						<PageBannerButton
							onClick={() => flow.push("GroupPage", { bookId: book.id, groupId: group.id })}
						>
							쪽 보기
						</PageBannerButton>
					}
				/>
			)}
			<div>
				<Text as="h1" textStyle="t7Bold">
					{book.title}
				</Text>
				<Text as="p" color="fg.neutralMuted" textStyle="t3Regular">
					{book.author} · {book.edition} · {book.pageCount}쪽
				</Text>
			</div>
			<FieldButton
				label="함께 읽기"
				buttonProps={{ onClick: () => setPickGroup(true), "aria-label": "함께 읽는 모임 선택" }}
			>
				<FieldButtonValue>{group?.name ?? "개인 독서"}</FieldButtonValue>
			</FieldButton>
			{groupId && groups.isSuccess && !group && (
				<Text role="alert" color="fg.critical">
					참여 중인 모임이 아니에요. 초대로 참여하거나 개인 독서를 선택해주세요.
				</Text>
			)}
			<PageNavigator book={book} page={page} groupId={groupId} allowed={!groupId || !!group} />
			{validPage ? (
				<>
					<ActionButton
						variant="neutralSolid"
						onClick={() =>
							flow.push("NoteEditorPage", { bookId: book.id, page: String(page), groupId })
						}
					>
						생각 남기기
					</ActionButton>
					<OwnNotes bookId={book.id} page={page} />
					<ActionButton variant="neutralWeak" onClick={() => setOpen(true)}>
						{group ? "이 모임의 다른 생각 열기" : "이전 공개 기록 열기"}
					</ActionButton>
					<Text textStyle="t3Regular" color="fg.neutralMuted">
						{group
							? "기록을 남기지 않아도 다른 생각을 볼 수 있어요."
							: "새 기록은 나만 보기로 저장돼요. 모임에 공유하면 함께 나눌 수 있어요."}
					</Text>
					<BottomSheetRoot open={open} onOpenChange={setOpen}>
						<BottomSheetContent
							title={`${page}쪽의 생각`}
							description={group?.name ?? "예전에 공용으로 남겨진 기록이에요."}
						>
							<BottomSheetBody>
								<div className="max-h-[65dvh] overflow-y-auto pb-x6">
									<PageBookmarks bookId={book.id} page={page} enabled={open} groupId={group?.id} />
								</div>
							</BottomSheetBody>
						</BottomSheetContent>
					</BottomSheetRoot>
				</>
			) : (
				<Text role="alert" color="fg.critical">
					페이지를 확인해주세요.
				</Text>
			)}
			<ActionButton
				variant="ghost"
				onClick={() => flow.push("GroupPage", { bookId: book.id, groupId: group?.id })}
			>
				함께 읽기 모임 보기
			</ActionButton>
			<BottomSheetRoot open={pickGroup} onOpenChange={setPickGroup}>
				<BottomSheetContent title="함께 읽는 모임 선택">
					<BottomSheetBody>
						<GroupPicker
							groups={groups.data?.filter((item) => item.bookId === book.id) ?? []}
							current={groupId ?? "private"}
							select={selectGroup}
						/>
						<LoadState
							pending={groups.isPending}
							error={groups.isError}
							retry={() => groups.refetch()}
						/>
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheetRoot>
		</>
	);
}

function GroupPicker({
	groups,
	current,
	select,
}: {
	groups: ReadingGroup[];
	current: string;
	select: (value: string) => void;
}) {
	const [value, setValue] = useState(current);
	return (
		<div className="flex max-h-[65dvh] flex-col gap-x4 overflow-y-auto pb-x6">
			<RadioSelectBoxRoot label="독서 공간" value={value} onValueChange={setValue}>
				<RadioSelectBoxItem
					value="private"
					label="개인 독서"
					suffix={<RadioSelectBoxRadiomark />}
				/>
				{groups.map((group) => (
					<RadioSelectBoxItem
						key={group.id}
						value={group.id}
						label={group.name}
						suffix={<RadioSelectBoxRadiomark />}
					/>
				))}
			</RadioSelectBoxRoot>
			<ActionButton variant="neutralSolid" onClick={() => select(value)}>
				이 공간에서 읽기
			</ActionButton>
		</div>
	);
}
