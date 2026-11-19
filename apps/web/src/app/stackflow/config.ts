import { defineConfig } from "@stackflow/config";

/**
 * Every screen (activity) is registered here: its name, URL, and params.
 * Adding a screen = add an entry here + a `Register` key below + a component
 * in `stack.tsx`. TypeScript then checks every `push("Name", params)` call.
 * `overlay` names the sheet open on the current step (see `useStepOverlay`).
 */
declare module "@stackflow/config" {
	interface Register {
		/** `tab`: home | search | my, switched with `replaceStep`. */
		HomePage: { tab?: string; overlay?: string };
		BookPage: { bookId: string; overlay?: string };
		/** Optional target passage (chapter, paragraph, range) to open at and select. */
		ReaderPage: {
			bookId: string;
			ch?: string;
			p?: string;
			s?: string;
			e?: string;
			overlay?: string;
		};
		InvitePage: { code: string; overlay?: string };
		/** 모임 만들기: 책 고르기(`step` 없음) → 이름(`step=name`) → GroupReadyPage. `books`: 고른 id(쉼표). */
		GroupNewPage: { step?: string; books?: string; overlay?: string };
		/** 모임을 만든 직후의 초대 화면. */
		GroupReadyPage: { libraryId: string; overlay?: string };
		/** 기존 모임 서재에 책 더 담기. */
		GroupBookPage: { libraryId: string; overlay?: string };
	}
}

export const config = defineConfig({
	activities: [
		{ name: "HomePage", route: "/" },
		{ name: "BookPage", route: "/books/:bookId" },
		{ name: "ReaderPage", route: "/books/:bookId/read" },
		{ name: "InvitePage", route: "/invite/:code" },
		{ name: "GroupNewPage", route: "/groups/new" },
		{ name: "GroupReadyPage", route: "/groups/:libraryId/ready" },
		{ name: "GroupBookPage", route: "/groups/:libraryId/books" },
	],
	initialActivity: () => "HomePage",
	transitionDuration: 350,
});
