import type { ActivityComponentType } from "@stackflow/react";
import { useActivity, useFlow, useStepFlow } from "@stackflow/react";
import { useQuery } from "@tanstack/react-query";
import { type DragEvent, useState } from "react";
import { useCurrentLibrary } from "@/entities/library";
import { personName, ReaderAvatar, useProfile } from "@/entities/profile";
import { DropHint, ImportProgressOverlay, useBookImport } from "@/features/book-import";
import { LibrarySheet } from "@/features/library-picker";
import { ProfileSheet } from "@/features/profile-edit";
import { orpc } from "@/shared/api";
import {
	AppBar,
	AppScreen,
	AppScreenContent,
	ChevronDownIcon,
	HomeTabIcon,
	HouseIcon,
	LibraryBigIcon,
	LoadState,
	SearchIcon,
	TabBar,
	useStepOverlay,
} from "@/shared/ui";
import { HomeFeed } from "./home-feed";
import { MyShelf } from "./my-shelf";
import { SearchPanel } from "./search-panel";

const tabs = [
	{ value: "home", label: "홈", icon: HouseIcon },
	{ value: "search", label: "찾기", icon: SearchIcon },
	{ value: "my", label: "내 서재", icon: LibraryBigIcon },
] as const;
type Tab = (typeof tabs)[number]["value"];

export const HomePage: ActivityComponentType<"HomePage"> = ({ params }) => {
	const flow = useFlow();
	const { replaceStep } = useStepFlow("HomePage");
	const { isActive } = useActivity();
	const overlay = useStepOverlay(["book-menu", "day"]);
	const { library, query: libraries } = useCurrentLibrary();
	const profile = useProfile();
	const tab: Tab = tabs.some((entry) => entry.value === params.tab) ? (params.tab as Tab) : "home";
	const [dragging, setDragging] = useState(false);
	const books = useQuery({
		...orpc.books.list.queryOptions({ input: { libraryId: library?.id ?? "" } }),
		enabled: !!library && tab === "home",
	});
	const importer = useBookImport((bookId) => flow.push("BookPage", { bookId }));
	const takenColors = (library?.members ?? [])
		.filter((member) => member.id !== profile.data?.id && member.color)
		.map((member) => member.color as string);
	const acceptsDrop = tab !== "search";
	const dropHandlers = acceptsDrop
		? {
				onDragOver: (event: DragEvent) => {
					if (!event.dataTransfer.types.includes("Files")) return;
					event.preventDefault();
					setDragging(true);
				},
				onDragLeave: (event: DragEvent) => {
					if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
				},
				onDrop: (event: DragEvent) => {
					event.preventDefault();
					setDragging(false);
					const file = event.dataTransfer.files[0];
					if (file) importer.importFile(file);
				},
			}
		: {};
	return (
		<AppScreen>
			<div className="relative flex min-h-0 flex-1 flex-col" {...dropHandlers}>
				{tab === "home" && (
					<AppBar className="justify-between px-2">
						<button
							type="button"
							onClick={() => overlay.open("library")}
							className="flex h-11 min-w-0 items-center gap-1 rounded-lg px-4 text-st7 font-bold text-strong outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
						>
							<span className="truncate">{library?.name ?? "서재"}</span>
							<ChevronDownIcon className="size-5 shrink-0" aria-hidden="true" />
							<span className="sr-only">, 서재 바꾸기</span>
						</button>
						<button
							type="button"
							onClick={() => overlay.open("profile")}
							aria-label="내 이름과 색"
							className="grid size-11 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
						>
							<ReaderAvatar
								person={profile.data}
								name={profile.data?.nick ?? personName(undefined, true)}
								size="md"
							/>
						</button>
					</AppBar>
				)}
				<AppScreenContent className="bg-background pb-[calc(88px+env(safe-area-inset-bottom))]">
					<LoadState
						pending={libraries.isPending}
						error={libraries.isError}
						retry={() => libraries.refetch()}
					/>
					{library && tab === "home" && <HomeFeed books={books} onImport={importer.chooseFile} />}
					{library && tab === "search" && (
						<SearchPanel libraryId={library.id} onImport={importer.chooseFile} />
					)}
					{library && tab === "my" && (
						<MyShelf libraryId={library.id} onImport={importer.chooseFile} />
					)}
				</AppScreenContent>
				{dragging && <DropHint />}
			</div>
			{isActive && (
				<TabBar
					value={tab}
					onValueChange={(value) => replaceStep({ tab: value })}
					options={tabs.map(({ value, label, icon: Icon }) => ({
						value,
						label,
						icon: value === "home" ? <HomeTabIcon /> : <Icon />,
					}))}
				/>
			)}
			<LibrarySheet />
			<ProfileSheet takenColors={takenColors} />
			<ImportProgressOverlay />
		</AppScreen>
	);
};
