import "@seed-design/css/recipes/action-button.layered.css";
import "@seed-design/css/recipes/app-bar.layered.css";
import "@seed-design/css/recipes/app-bar-main.layered.css";
import "@seed-design/css/recipes/app-screen.layered.css";
import "@seed-design/css/recipes/list-item.layered.css";
import "@seed-design/css/recipes/list-header.layered.css";
import "@seed-design/css/recipes/page-banner.layered.css";
import "@seed-design/css/recipes/bottom-sheet.layered.css";
import "@seed-design/css/recipes/text-input.layered.css";
import "@seed-design/css/recipes/field.layered.css";
import "@seed-design/css/recipes/field-label.layered.css";
import type { Book, ReadingGroup } from "@app/contract";
import {
	IconBookFill,
	IconEnvelopeLine,
	IconHouseFill,
	IconPeople3Line,
	IconPlusLine,
} from "@karrotmarket/react-monochrome-icon";
import { ActionButton, Badge, List, ListHeader, Tabs, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { bookByline } from "@/entities/book";
import { Archive } from "@/features/archive";
import { GroupCreate } from "@/features/group/create";
import { orpc } from "@/shared/api";
import { dayjs } from "@/shared/lib";
import {
	AppBar,
	AppBarIconButton,
	AppBarLeft,
	AppBarRight,
	AppScreen,
	AppScreenContent,
	BottomSheetBody,
	BottomSheetContent,
	BottomSheetRoot,
	LoadState,
	ResultSection,
	SnackbarAvoidOverlap,
	SwipeableMenuSheetContent,
	SwipeableMenuSheetGroup,
	SwipeableMenuSheetItem,
	SwipeableMenuSheetRoot,
	TextField,
	TextFieldInput,
	useStepOverlay,
} from "@/shared/ui";

export const HomePage: ActivityComponentType<"HomePage"> = ({ params }) => {
	const flow = useFlow();
	const { replaceStep } = useStepFlow("HomePage");
	const { isActive } = useActivity();
	const overlay = useStepOverlay();
	const [inviteCode, setInviteCode] = useState("");
	const section = params.section === "books" ? "books" : "home";
	const tab = params.tab === "notes" ? "notes" : "books";
	const filter = ["private", "shared"].includes(params.filter ?? "")
		? (params.filter ?? "all")
		: "all";
	const books = useQuery(orpc.reading.listBooks.queryOptions());
	const recent = useQuery(orpc.reading.listRecent.queryOptions());
	const groups = useQuery(orpc.groups.list.queryOptions());
	const change = (next: string, nextTab = tab, nextFilter = filter) =>
		replaceStep({ section: next, tab: nextTab, filter: nextFilter });
	const openBook = (book: Book) => flow.push("ReadingPage", { bookId: book.id });
	const openGroup = (group: ReadingGroup) =>
		flow.push("GroupPage", { bookId: group.bookId, groupId: group.id });
	const opened = new Set(recent.data?.map((item) => item.book.id));
	const unopened = books.data?.filter((book) => !opened.has(book.id)) ?? [];
	// 모임을 만들 책은 최근에 읽은 책부터 보여줘요.
	const groupBooks = [...(recent.data?.map((item) => item.book) ?? []), ...unopened];
	return (
		<AppScreen>
			<AppBar>
				<AppBarLeft>
					<Text textStyle="t6Bold">{section === "home" ? "함께 읽기" : "책장"}</Text>
				</AppBarLeft>
				<AppBarRight>
					{section === "home" && (
						<AppBarIconButton
							aria-label="모임 참여 또는 만들기"
							onClick={() => overlay.open("menu")}
						>
							<IconPlusLine />
						</AppBarIconButton>
					)}
				</AppBarRight>
			</AppBar>
			<AppScreenContent>
				<main className="min-h-full bg-bg-layer-default pb-[calc(80px+env(safe-area-inset-bottom))]">
					{section === "home" ? (
						<div className="flex flex-col gap-x6 py-x5">
							<div className="px-x4">
								<Text as="h1" textStyle="t8Bold">
									각자의 속도로, 함께 읽어요
								</Text>
								<Text as="p" color="fg.neutralMuted" className="mt-x2">
									읽던 장면으로 돌아가 내 생각을 남겨보세요.
								</Text>
							</div>
							<section>
								<ListHeader as="h2">이어 읽기</ListHeader>
								<LoadState
									pending={recent.isPending || books.isPending}
									error={recent.isError || books.isError}
									retry={() => {
										recent.refetch();
										books.refetch();
									}}
								/>
								{recent.isSuccess && books.isSuccess && (
									<>
										<RecentRows
											items={recent.data}
											groups={groups.data ?? []}
											onSelect={openBook}
										/>
										{recent.data.length === 0 && unopened.length > 0 && (
											<div className="px-x4">
												<Text color="fg.neutralMuted">
													아직 펼친 책이 없어요. 아래에서 읽을 책을 골라주세요.
												</Text>
											</div>
										)}
										{books.data.length === 0 && (
											<ResultSection
												size="medium"
												title="등록된 책이 없어요"
												description="책이 준비되면 여기서 이어 읽을 수 있어요."
											/>
										)}
									</>
								)}
							</section>
							{unopened.length > 0 && (
								<BookRows title="새로 펼칠 책" books={unopened} onSelect={openBook} />
							)}
							<section>
								<ListHeader as="h2">함께 읽는 모임</ListHeader>
								<LoadState
									pending={groups.isPending}
									error={groups.isError}
									retry={() => groups.refetch()}
								/>
								{groups.data?.length ? (
									<GroupRows groups={groups.data} books={books.data ?? []} onSelect={openGroup} />
								) : (
									groups.isSuccess && (
										<div className="px-x4">
											<Text color="fg.neutralMuted">
												오른쪽 위 + 버튼으로 모임을 만들거나 초대받은 모임에 참여할 수 있어요.
											</Text>
										</div>
									)
								)}
							</section>
						</div>
					) : (
						<Tabs.Root value={tab} onValueChange={(value) => change("books", value)}>
							<Tabs.List aria-label="책장 콘텐츠">
								<Tabs.Trigger value="books">책</Tabs.Trigger>
								<Tabs.Trigger value="notes">내 기록</Tabs.Trigger>
								<Tabs.Indicator />
							</Tabs.List>
							<Tabs.Content value="books">
								<LoadState
									pending={books.isPending}
									error={books.isError}
									retry={() => books.refetch()}
								/>
								{books.isSuccess &&
									(books.data.length ? (
										<BookRows title="읽을 책" books={books.data} onSelect={openBook} />
									) : (
										<ResultSection
											size="medium"
											title="등록된 책이 없어요"
											description="책이 준비되면 여기서 이어 읽을 수 있어요."
										/>
									))}
							</Tabs.Content>
							<Tabs.Content value="notes">
								<Archive
									filter={filter}
									onFilter={(value) => change("books", "notes", value)}
									onSelect={(noteId) => flow.push("NotePage", { noteId })}
									onBrowse={() => change("books", "books")}
								/>
							</Tabs.Content>
						</Tabs.Root>
					)}
				</main>
				<SwipeableMenuSheetRoot {...overlay.bind("menu")}>
					<SwipeableMenuSheetContent title="함께 읽기 모임">
						<SwipeableMenuSheetGroup>
							<SwipeableMenuSheetItem
								prefixIcon={<IconEnvelopeLine />}
								label="초대 코드로 참여"
								description="받은 코드나 링크를 붙여넣어요"
								onClick={() => overlay.switchTo("join")}
							/>
							{groupBooks.length > 0 && (
								<SwipeableMenuSheetItem
									prefixIcon={<IconPeople3Line />}
									label="새 모임 만들기"
									description="같은 책을 읽을 사람을 초대해요"
									onClick={() => overlay.switchTo("create")}
								/>
							)}
						</SwipeableMenuSheetGroup>
					</SwipeableMenuSheetContent>
				</SwipeableMenuSheetRoot>
				<BottomSheetRoot {...overlay.bind("join")}>
					<BottomSheetContent
						title="초대받은 모임 참여"
						description="받은 초대 코드나 링크를 붙여넣어주세요."
					>
						<BottomSheetBody>
							<form
								autoComplete="off"
								className="flex flex-col gap-x3 pb-x6"
								onSubmit={(event) => {
									event.preventDefault();
									const code = inviteCode.trim().split("/").filter(Boolean).pop();
									if (!code) return;
									overlay.close();
									setInviteCode("");
									flow.push("InvitePage", { code });
								}}
							>
								<TextField
									label="모임 초대 코드 또는 링크"
									value={inviteCode}
									onValueChange={({ value }) => setInviteCode(value)}
								>
									<TextFieldInput
										type="text"
										name="reading-invitation-code"
										inputMode="text"
										autoComplete="off"
										autoCapitalize="characters"
										autoCorrect="off"
										spellCheck={false}
										placeholder="예: K7MW3PQX"
										required
									/>
								</TextField>
								<ActionButton variant="brandSolid" type="submit">
									초대 확인하기
								</ActionButton>
							</form>
						</BottomSheetBody>
					</BottomSheetContent>
				</BottomSheetRoot>
				{groupBooks[0] && (
					<BottomSheetRoot {...overlay.bind("create")}>
						<BottomSheetContent title="새 함께 읽기 모임">
							<BottomSheetBody>
								<GroupCreate
									books={groupBooks}
									defaultBookId={groupBooks[0].id}
									onCreated={(group) => {
										overlay.close();
										flow.push("GroupPage", { bookId: group.bookId, groupId: group.id });
									}}
								/>
							</BottomSheetBody>
						</BottomSheetContent>
					</BottomSheetRoot>
				)}
				{isActive && (
					<SnackbarAvoidOverlap>
						<nav
							className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 border-t border-stroke-neutral-weak bg-bg-layer-default px-x2 pb-[env(safe-area-inset-bottom)]"
							aria-label="하단 내비게이션"
						>
							{[
								{ value: "home", label: "홈", icon: IconHouseFill },
								{ value: "books", label: "책장", icon: IconBookFill },
							].map(({ value, label, icon: Icon }) => (
								<button
									key={value}
									type="button"
									aria-current={section === value ? "page" : undefined}
									onClick={() => change(value)}
									className="flex h-x16 flex-col items-center justify-center gap-x1 bg-transparent p-0 text-fg-neutral-muted outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-ring active:bg-bg-neutral-weak aria-[current=page]:text-fg-neutral"
								>
									<Icon size={24} className="size-x6 shrink-0" aria-hidden="true" />
									<Text textStyle="t2Medium">{label}</Text>
								</button>
							))}
						</nav>
					</SnackbarAvoidOverlap>
				)}
			</AppScreenContent>
		</AppScreen>
	);
};

function BookRows({
	title,
	books,
	onSelect,
}: {
	title: string;
	books: Book[];
	onSelect: (book: Book) => void;
}) {
	return (
		<section>
			<ListHeader as="h2">{title}</ListHeader>
			<List.Root as="div">
				{books.map((book) => (
					<List.Item key={book.id} asChild>
						<button type="button" className="w-full text-left" onClick={() => onSelect(book)}>
							<List.Content>
								<List.Title>{book.title}</List.Title>
								<List.Detail>
									{bookByline(book)} · {book.pageCount}쪽
								</List.Detail>
							</List.Content>
						</button>
					</List.Item>
				))}
			</List.Root>
		</section>
	);
}

type RecentItem = {
	book: Book;
	currentPage: number;
	lastOpenedAt: string;
	lastGroupId: string | null;
};

/** 읽던 책과 쪽, 함께 읽는 공간을 보여주고 누르면 그 자리로 돌아가요. */
function RecentRows({
	items,
	groups,
	onSelect,
}: {
	items: RecentItem[];
	groups: ReadingGroup[];
	onSelect: (book: Book) => void;
}) {
	if (!items.length) return null;
	return (
		<List.Root as="div">
			{items.map((item) => {
				const group = groups.find((entry) => entry.id === item.lastGroupId);
				return (
					<List.Item key={item.book.id} asChild>
						<button type="button" className="w-full text-left" onClick={() => onSelect(item.book)}>
							<List.Content>
								<List.Title>{item.book.title}</List.Title>
								<List.Detail>
									{item.currentPage}쪽까지 · {group?.name ?? "개인 독서"} ·{" "}
									{dayjs(item.lastOpenedAt).fromNow()}
									{group && group.unreadCount > 0 && <NewThoughtBadge />}
								</List.Detail>
							</List.Content>
						</button>
					</List.Item>
				);
			})}
		</List.Root>
	);
}

function GroupRows({
	groups,
	books,
	onSelect,
}: {
	groups: ReadingGroup[];
	books: Book[];
	onSelect: (group: ReadingGroup) => void;
}) {
	return (
		<List.Root as="div">
			{groups.map((group) => (
				<List.Item key={group.id} asChild>
					<button type="button" className="w-full text-left" onClick={() => onSelect(group)}>
						<List.Content>
							<List.Title>{group.name}</List.Title>
							<List.Detail>
								{books.find((book) => book.id === group.bookId)?.title ?? "함께 읽는 책"} ·{" "}
								{group.memberCount}명{group.unreadCount > 0 && <NewThoughtBadge />}
							</List.Detail>
						</List.Content>
					</button>
				</List.Item>
			))}
		</List.Root>
	);
}

/** 숫자 없이 새 생각이 있다는 사실만 알려줘요. 재촉으로 읽히지 않게 Neutral Weak를 써요. */
function NewThoughtBadge() {
	return (
		<Badge.Root tone="neutral" variant="weak">
			<Badge.Label>새 생각</Badge.Label>
		</Badge.Root>
	);
}
