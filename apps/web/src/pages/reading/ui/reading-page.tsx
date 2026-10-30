import "@seed-design/css/recipes/bottom-sheet.layered.css";
import "@seed-design/css/recipes/text-input.layered.css";
import "@seed-design/css/recipes/field.layered.css";
import "@seed-design/css/recipes/field-label.layered.css";
import type { Book, ReadingGroup } from "@app/contract";
import {
	IconBookmarkLine,
	IconChevronDownLine,
	IconILowercaseSerifCircleLine,
	IconPencilLine,
	IconPerson2Line,
	IconQuotationmark2LeftLine,
} from "@karrotmarket/react-monochrome-icon";
import { ActionButton, PrefixIcon, SuffixIcon, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { orpc } from "@/shared/api";
import {
	AppBarIconButton,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetRoot,
	ContextualFloatingButton,
	FloatingActionButton,
	LoadState,
	MobileScreen,
	PageBanner,
	PageBannerButton,
	RadioSelectBoxItem,
	RadioSelectBoxRadiomark,
	RadioSelectBoxRoot,
	useStepOverlay,
} from "@/shared/ui";
import { OwnNotes } from "./own-notes";
import { PageBookmarks } from "./page-bookmarks";
import { PageBar } from "./page-navigator";
import { PageText } from "./page-text";

export const ReadingPage: ActivityComponentType<"ReadingPage"> = ({ params }) => {
	const book = useQuery(orpc.reading.getBook.queryOptions({ input: { bookId: params.bookId } }));
	const groups = useQuery(orpc.groups.list.queryOptions());
	const flow = useFlow();
	const overlay = useStepOverlay();
	const { isRoot } = useActivity();
	const [quote, setQuote] = useState<string | null>(null);
	const groupId =
		params.groupId === "private"
			? undefined
			: (params.groupId ?? book.data?.lastGroupId ?? undefined);
	const group = groups.data?.find((item) => item.id === groupId);
	const page = Number(params.page ?? book.data?.currentPage);
	const canWrite =
		!!book.data && Number.isInteger(page) && page > 0 && page <= book.data.book.pageCount;
	const write = (selected?: string) => {
		document.getSelection()?.removeAllRanges();
		flow.push("NoteEditorPage", {
			bookId: params.bookId,
			page: String(page),
			groupId,
			quote: selected,
		});
	};
	return (
		<MobileScreen
			title={book.data?.book.title ?? "책 읽기"}
			onBack={() => (isRoot ? flow.replace("HomePage", {}) : flow.pop())}
			action={
				book.data && (
					<>
						<AppBarIconButton aria-label="책 정보" onClick={() => overlay.open("info")}>
							<IconILowercaseSerifCircleLine />
						</AppBarIconButton>
						<AppBarIconButton
							aria-label="함께 읽기 모임"
							onClick={() => flow.push("GroupPage", { bookId: params.bookId, groupId })}
						>
							<IconPerson2Line />
						</AppBarIconButton>
					</>
				)
			}
			// 문장을 고르는 동안에는 그 문장으로 쓰는 보조 액션만 보여줘요. 떠 있는 버튼은 하나씩.
			fab={
				canWrite &&
				!quote && (
					// 본문을 가리지 않도록 아이콘만 보여요. label은 스크린 리더용으로 남겨요.
					<FloatingActionButton
						extended={false}
						icon={<IconPencilLine />}
						label="생각 남기기"
						onClick={() => write()}
					/>
				)
			}
			contextual={
				canWrite &&
				quote && (
					<ContextualFloatingButton variant="solid" onClick={() => write(quote)}>
						<PrefixIcon svg={<IconQuotationmark2LeftLine />} />이 문장으로 생각 남기기
					</ContextualFloatingButton>
				)
			}
			footer={
				book.data && (
					<PageBar
						book={book.data.book}
						page={page}
						groupId={groupId}
						allowed={!groupId || !!group}
					/>
				)
			}
		>
			<LoadState
				shape="reading"
				pending={book.isPending}
				error={book.isError}
				retry={() => book.refetch()}
			/>
			{book.data && (
				<ReadingContent
					key={`${params.bookId}:${groupId ?? "private"}`}
					book={book.data.book}
					page={page}
					groupId={groupId}
					groups={groups.data ?? []}
					groupsLoaded={groups.isSuccess}
					onSelectQuote={setQuote}
				/>
			)}
		</MobileScreen>
	);
};

function ReadingContent({
	book,
	page,
	groupId,
	groups,
	groupsLoaded,
	onSelectQuote,
}: {
	book: Book;
	page: number;
	groupId?: string;
	groups: ReadingGroup[];
	groupsLoaded: boolean;
	onSelectQuote: (quote: string | null) => void;
}) {
	const flow = useFlow();
	const { replaceStep } = useStepFlow("ReadingPage");
	const overlay = useStepOverlay();
	const group = groups.find((item) => item.id === groupId);
	const member = !groupId || !!group;
	const validPage = Number.isInteger(page) && page > 0 && page <= book.pageCount;
	const selectGroup = (selected: string) => {
		overlay.close();
		replaceStep({ bookId: book.id, page: String(page), groupId: selected });
	};
	return (
		<>
			{group && group.unreadCount > 0 && (
				<PageBanner
					tone="neutral"
					variant="weak"
					description="이 모임에 새로운 생각이 있어요"
					suffix={
						<PageBannerButton
							onClick={() => flow.push("GroupPage", { bookId: book.id, groupId: group.id })}
						>
							쪽 보기
						</PageBannerButton>
					}
				/>
			)}
			<div className="flex items-center justify-between gap-x2">
				<ActionButton
					variant="ghost"
					size="small"
					aria-label="함께 읽는 공간 선택"
					onClick={() => overlay.open("space")}
				>
					{group?.name ?? "개인 독서"}
					<SuffixIcon svg={<IconChevronDownLine />} />
				</ActionButton>
				{validPage && member && (
					<BookmarkButton
						bookId={book.id}
						page={page}
						groupId={group?.id}
						onOpen={() => overlay.open("thoughts")}
					/>
				)}
			</div>
			{groupId && groupsLoaded && !group && (
				<Text role="alert" color="fg.critical">
					참여 중인 모임이 아니에요. 초대로 참여하거나 개인 독서를 선택해주세요.
				</Text>
			)}
			{validPage ? (
				<>
					<PageText bookId={book.id} page={page} onSelectQuote={onSelectQuote} />
					<OwnNotes bookId={book.id} page={page} />
					<BottomSheetRoot {...overlay.bind("thoughts")}>
						<BottomSheetContent
							title={`${page}쪽의 책갈피`}
							description={group?.name ?? "예전에 공용으로 남겨진 기록이에요."}
						>
							<BottomSheetBody>
								<div className="max-h-[65dvh] overflow-y-auto pb-x6">
									<PageBookmarks
										bookId={book.id}
										page={page}
										enabled={overlay.current === "thoughts"}
										groupId={group?.id}
									/>
								</div>
							</BottomSheetBody>
						</BottomSheetContent>
					</BottomSheetRoot>
				</>
			) : (
				<Text role="alert" color="fg.critical">
					1~{book.pageCount}쪽 사이로 골라주세요.
				</Text>
			)}
			<BottomSheetRoot {...overlay.bind("space")}>
				<BottomSheetContent title="함께 읽는 공간">
					<BottomSheetBody>
						<GroupPicker
							groups={groups.filter((item) => item.bookId === book.id)}
							current={groupId ?? "private"}
							select={selectGroup}
						/>
						<LoadState pending={!groupsLoaded} error={false} retry={() => undefined} />
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheetRoot>
			<BottomSheetRoot {...overlay.bind("info")}>
				<BottomSheetContent title={book.title} description={book.author}>
					<BottomSheetBody>
						<BookInfo book={book} />
					</BottomSheetBody>
				</BottomSheetContent>
			</BottomSheetRoot>
		</>
	);
}

/**
 * 노션 아이디에이션의 "페이지 팝업 책갈피"입니다. 이 쪽에 다른 독자가 남긴 기록의 수만 보여주고,
 * 내용은 눌렀을 때 열어요.
 */
function BookmarkButton({
	bookId,
	page,
	groupId,
	onOpen,
}: {
	bookId: string;
	page: number;
	groupId?: string;
	onOpen: () => void;
}) {
	const count = useQuery(
		orpc.reading.pageNoteCount.queryOptions({ input: { bookId, page, groupId: groupId ?? null } }),
	);
	const label = count.isSuccess
		? count.data.count > 0
			? `책갈피 ${count.data.count}`
			: "책갈피 없음"
		: "책갈피";
	return (
		<ActionButton
			variant="ghost"
			size="small"
			aria-label={
				count.isSuccess
					? `이 쪽의 다른 독자 책갈피 ${count.data.count}개 열기`
					: "이 쪽의 다른 독자 책갈피 열기"
			}
			onClick={onOpen}
		>
			<PrefixIcon svg={<IconBookmarkLine />} />
			{label}
		</ActionButton>
	);
}

function BookInfo({ book }: { book: Book }) {
	return (
		<dl className="grid grid-cols-[5rem_1fr] gap-x-x3 gap-y-x2 pb-x6">
			<Text as="dt" color="fg.neutralMuted">
				분량
			</Text>
			<Text as="dd">{book.pageCount}쪽</Text>
			<Text as="dt" color="fg.neutralMuted">
				이용 조건
			</Text>
			<Text as="dd">{book.license ?? "확인되지 않았어요"}</Text>
			<Text as="dt" color="fg.neutralMuted">
				원문 출처
			</Text>
			<Text as="dd" className="break-all">
				{book.sourceUrl ? (
					<a href={book.sourceUrl} target="_blank" rel="noreferrer" className="underline">
						{decodeURI(book.sourceUrl)}
					</a>
				) : (
					"확인되지 않았어요"
				)}
			</Text>
		</dl>
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
					description="새 기록은 나만 보기로 저장돼요"
					suffix={<RadioSelectBoxRadiomark />}
				/>
				{groups.map((group) => (
					<RadioSelectBoxItem
						key={group.id}
						value={group.id}
						label={group.name}
						description="이 모임에 공유한 생각을 함께 봐요"
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
