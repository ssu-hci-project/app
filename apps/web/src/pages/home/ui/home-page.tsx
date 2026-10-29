import "@seed-design/css/recipes/action-button.layered.css";
import "@seed-design/css/recipes/app-bar.layered.css";
import "@seed-design/css/recipes/app-bar-main.layered.css";
import "@seed-design/css/recipes/app-screen.layered.css";
import "@seed-design/css/recipes/list-item.layered.css";
import "@seed-design/css/recipes/list-header.layered.css";
import "@seed-design/css/recipes/page-banner.layered.css";
import type { Book, ReadingGroup } from "@app/contract";
import { IconBookFill, IconBookLine, IconHouseFill } from "@karrotmarket/react-monochrome-icon";
import { ActionButton, Badge, List, ListHeader, Tabs, Text } from "@seed-design/react";
import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Archive } from "@/features/archive";
import { orpc } from "@/shared/api";
import {
	AppBar,
	AppBarIconButton,
	AppBarLeft,
	AppBarRight,
	AppScreen,
	AppScreenContent,
	LoadState,
	ResultSection,
	SnackbarAvoidOverlap,
	TextField,
	TextFieldInput,
} from "@/shared/ui";

export const HomePage: ActivityComponentType<"HomePage"> = ({ params }) => {
	const flow = useFlow();
	const { replaceStep } = useStepFlow("HomePage");
	const { isActive } = useActivity();
	const [inviteCode, setInviteCode] = useState("");
	const section = params.section === "books" ? "books" : "home";
	const tab = params.tab === "notes" ? "notes" : "books";
	const filter = ["private", "shared"].includes(params.filter ?? "")
		? (params.filter ?? "all")
		: "all";
	const books = useQuery(orpc.reading.listBooks.queryOptions());
	const groups = useQuery(orpc.groups.list.queryOptions());
	const change = (next: string, nextTab = tab, nextFilter = filter) =>
		replaceStep({ section: next, tab: nextTab, filter: nextFilter });
	const openBook = (book: Book) => flow.push("ReadingPage", { bookId: book.id });
	const openGroup = (group: ReadingGroup) =>
		flow.push("GroupPage", { bookId: group.bookId, groupId: group.id });
	return (
		<AppScreen>
			<AppBar>
				<AppBarLeft>
					<Text textStyle="t6Bold">{section === "home" ? "함께 읽기" : "책장"}</Text>
				</AppBarLeft>
				<AppBarRight>
					<AppBarIconButton aria-label="책장 열기" onClick={() => change("books")}>
						<IconBookLine />
					</AppBarIconButton>
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
							<BookRows
								books={books.data ?? []}
								pending={books.isPending}
								error={books.isError}
								retry={() => books.refetch()}
								onSelect={openBook}
							/>
							<section>
								<ListHeader as="h2">함께 읽는 모임</ListHeader>
								<LoadState
									pending={groups.isPending}
									error={groups.isError}
									retry={() => groups.refetch()}
								/>
								{groups.data?.length ? (
									<List.Root as="div">
										{groups.data.map((group) => (
											<List.Item key={group.id} asChild>
												<button
													type="button"
													className="w-full text-left"
													onClick={() => openGroup(group)}
												>
													<List.Content>
														<List.Title>{group.name}</List.Title>
														<List.Detail>
															{group.memberCount}명이 각자의 속도로 읽고 있어요.
															{group.unreadCount > 0 && (
																<Badge.Root tone="neutral" variant="weak">
																	<Badge.Label>새 생각</Badge.Label>
																</Badge.Root>
															)}
														</List.Detail>
													</List.Content>
												</button>
											</List.Item>
										))}
									</List.Root>
								) : (
									groups.isSuccess && (
										<div className="px-x4">
											<Text color="fg.neutralMuted">
												책을 선택하면 함께 읽기 모임을 만들 수 있어요.
											</Text>
										</div>
									)
								)}
							</section>
							<form
								autoComplete="off"
								className="flex flex-col gap-x3 px-x4"
								onSubmit={(event) => {
									event.preventDefault();
									const code = inviteCode.trim().split("/").filter(Boolean).pop();
									if (code) flow.push("InvitePage", { code });
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
										autoCapitalize="none"
										autoCorrect="off"
										spellCheck={false}
										placeholder="초대 코드나 링크를 붙여넣어주세요"
										required
									/>
								</TextField>
								<ActionButton variant="neutralWeak" type="submit">
									초대 확인하기
								</ActionButton>
							</form>
						</div>
					) : (
						<Tabs.Root value={tab} onValueChange={(value) => change("books", value)}>
							<Tabs.List aria-label="책장 콘텐츠">
								<Tabs.Trigger value="books">책</Tabs.Trigger>
								<Tabs.Trigger value="notes">내 기록</Tabs.Trigger>
								<Tabs.Indicator />
							</Tabs.List>
							<Tabs.Content value="books">
								<BookRows
									books={books.data ?? []}
									pending={books.isPending}
									error={books.isError}
									retry={() => books.refetch()}
									onSelect={openBook}
								/>
							</Tabs.Content>
							<Tabs.Content value="notes">
								<Archive
									filter={filter}
									onFilter={(value) => change("books", "notes", value)}
									onSelect={(noteId) => flow.push("NotePage", { noteId })}
								/>
							</Tabs.Content>
						</Tabs.Root>
					)}
				</main>
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
	books,
	pending,
	error,
	retry,
	onSelect,
}: {
	books: Book[];
	pending: boolean;
	error: boolean;
	retry: () => void;
	onSelect: (book: Book) => void;
}) {
	return (
		<section>
			<ListHeader as="h2">읽을 책</ListHeader>
			<LoadState pending={pending} error={error} retry={retry} />
			{!pending && !error && !books.length && (
				<ResultSection
					size="medium"
					title="등록된 책이 없어요"
					description="책이 준비되면 여기서 이어 읽을 수 있어요."
				/>
			)}
			<List.Root as="div">
				{books.map((book) => (
					<List.Item key={book.id} asChild>
						<button type="button" className="w-full text-left" onClick={() => onSelect(book)}>
							<List.Content>
								<List.Title>{book.title}</List.Title>
								<List.Detail>
									{book.author} · {book.edition} · {book.pageCount}쪽
								</List.Detail>
							</List.Content>
						</button>
					</List.Item>
				))}
			</List.Root>
		</section>
	);
}
