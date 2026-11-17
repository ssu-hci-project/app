import type { LegacyBook as Book, ReadingGroup } from "@app/contract";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon, HouseIcon, MailIcon, PlusIcon, UsersIcon } from "lucide-react";
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
	Badge,
	BottomSheet,
	BottomSheetBody,
	BottomSheetContent,
	Button,
	List,
	ListButton,
	ListHeader,
	LoadState,
	MenuSheet,
	MenuSheetContent,
	MenuSheetItem,
	ResultSection,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	TextField,
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
					<span className="text-lg font-bold">{section === "home" ? "함께 읽기" : "책장"}</span>
				</AppBarLeft>
				<AppBarRight>
					{section === "home" && (
						<AppBarIconButton
							aria-label="모임 참여 또는 만들기"
							onClick={() => overlay.open("menu")}
						>
							<PlusIcon />
						</AppBarIconButton>
					)}
				</AppBarRight>
			</AppBar>
			<AppScreenContent>
				<main className="min-h-full bg-card pb-[calc(80px+env(safe-area-inset-bottom))]">
					{section === "home" ? (
						<div className="flex flex-col gap-6 py-5">
							<div className="px-4">
								<h1 className="text-2xl font-bold">각자의 속도로, 함께 읽어요</h1>
								<p className="mt-2 text-muted-foreground">
									읽던 장면으로 돌아가 내 생각을 남겨보세요.
								</p>
							</div>
							<section>
								<ListHeader>이어 읽기</ListHeader>
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
											<p className="px-4 text-muted-foreground">
												아직 펼친 책이 없어요. 아래에서 읽을 책을 골라주세요.
											</p>
										)}
										{books.data.length === 0 && (
											<ResultSection
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
								<ListHeader>함께 읽는 모임</ListHeader>
								<LoadState
									pending={groups.isPending}
									error={groups.isError}
									retry={() => groups.refetch()}
								/>
								{groups.data?.length ? (
									<GroupRows groups={groups.data} books={books.data ?? []} onSelect={openGroup} />
								) : (
									groups.isSuccess && (
										<p className="px-4 text-muted-foreground">
											오른쪽 위 + 버튼으로 모임을 만들거나 초대받은 모임에 참여할 수 있어요.
										</p>
									)
								)}
							</section>
						</div>
					) : (
						<Tabs
							value={tab}
							onValueChange={(value) => change("books", value as string)}
							className="gap-0"
						>
							<TabsList
								variant="line"
								aria-label="책장 콘텐츠"
								className="h-12! w-full rounded-none border-b px-4"
							>
								<TabsTrigger value="books">책</TabsTrigger>
								<TabsTrigger value="notes">내 기록</TabsTrigger>
							</TabsList>
							<TabsContent value="books">
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
											title="등록된 책이 없어요"
											description="책이 준비되면 여기서 이어 읽을 수 있어요."
										/>
									))}
							</TabsContent>
							<TabsContent value="notes">
								<Archive
									filter={filter}
									onFilter={(value) => change("books", "notes", value)}
									onSelect={(noteId) => flow.push("NotePage", { noteId })}
									onBrowse={() => change("books", "books")}
								/>
							</TabsContent>
						</Tabs>
					)}
				</main>
				<MenuSheet {...overlay.bind("menu")}>
					<MenuSheetContent title="함께 읽기 모임">
						<MenuSheetItem
							icon={<MailIcon />}
							label="초대 코드로 참여"
							description="받은 코드나 링크를 붙여넣어요"
							onClick={() => overlay.switchTo("join")}
						/>
						{groupBooks.length > 0 && (
							<MenuSheetItem
								icon={<UsersIcon />}
								label="새 모임 만들기"
								description="같은 책을 읽을 사람을 초대해요"
								onClick={() => overlay.switchTo("create")}
							/>
						)}
					</MenuSheetContent>
				</MenuSheet>
				<BottomSheet {...overlay.bind("join")}>
					<BottomSheetContent
						title="초대받은 모임 참여"
						description="받은 초대 코드나 링크를 붙여넣어주세요."
					>
						<BottomSheetBody>
							<form
								autoComplete="off"
								className="flex flex-col gap-3"
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
									onChange={(event) => setInviteCode(event.target.value)}
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
								<Button type="submit" size="lg">
									초대 확인하기
								</Button>
							</form>
						</BottomSheetBody>
					</BottomSheetContent>
				</BottomSheet>
				{groupBooks[0] && (
					<BottomSheet {...overlay.bind("create")}>
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
					</BottomSheet>
				)}
				{isActive && (
					<nav
						className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-2 border-t bg-card px-2 pb-[env(safe-area-inset-bottom)]"
						aria-label="하단 내비게이션"
					>
						{[
							{ value: "home", label: "홈", icon: HouseIcon },
							{ value: "books", label: "책장", icon: BookOpenIcon },
						].map(({ value, label, icon: Icon }) => (
							<button
								key={value}
								type="button"
								aria-current={section === value ? "page" : undefined}
								onClick={() => change(value)}
								className="flex h-16 flex-col items-center justify-center gap-1 bg-transparent p-0 text-muted-foreground outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-ring active:bg-muted aria-[current=page]:text-foreground"
							>
								<Icon className="size-6 shrink-0" aria-hidden="true" />
								<span className="text-xs font-medium">{label}</span>
							</button>
						))}
					</nav>
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
			<ListHeader>{title}</ListHeader>
			<List>
				{books.map((book) => (
					<ListButton
						key={book.id}
						title={book.title}
						detail={`${bookByline(book)} · ${book.pageCount}쪽`}
						onClick={() => onSelect(book)}
					/>
				))}
			</List>
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
		<List>
			{items.map((item) => {
				const group = groups.find((entry) => entry.id === item.lastGroupId);
				return (
					<ListButton
						key={item.book.id}
						title={item.book.title}
						detail={
							<>
								{item.currentPage}쪽까지 · {group?.name ?? "개인 독서"} ·{" "}
								{dayjs(item.lastOpenedAt).fromNow()}
								{group && group.unreadCount > 0 && <NewThoughtBadge />}
							</>
						}
						onClick={() => onSelect(item.book)}
					/>
				);
			})}
		</List>
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
		<List>
			{groups.map((group) => (
				<ListButton
					key={group.id}
					title={group.name}
					detail={
						<>
							{books.find((book) => book.id === group.bookId)?.title ?? "함께 읽는 책"} ·{" "}
							{group.memberCount}명{group.unreadCount > 0 && <NewThoughtBadge />}
						</>
					}
					onClick={() => onSelect(group)}
				/>
			))}
		</List>
	);
}

/** 숫자 없이 새 생각이 있다는 사실만 알려줘요. 재촉으로 읽히지 않게 강조색을 쓰지 않아요. */
function NewThoughtBadge() {
	return (
		<Badge variant="outline" className="ml-1.5">
			새 생각
		</Badge>
	);
}
