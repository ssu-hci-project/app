import { defineConfig } from "@stackflow/config";

/**
 * Every screen (activity) is registered here: its name, URL, and params.
 * Adding a screen = add an entry here + a `Register` key below + a component
 * in `stack.tsx`. TypeScript then checks every `push("Name", params)` call.
 * `overlay` names the sheet open on the current step (see `useStepOverlay`).
 */
declare module "@stackflow/config" {
	interface Register {
		HomePage: { section?: string; tab?: string; filter?: string; overlay?: string };
		ReadingPage: { bookId: string; page?: string; groupId?: string; overlay?: string };
		NoteEditorPage: {
			bookId: string;
			page: string;
			noteId?: string;
			groupId?: string;
			/** 리더에서 고른 문장. 작성 화면의 "기억할 구절"을 채웁니다. */
			quote?: string;
			overlay?: string;
		};
		NotePage: { noteId: string; overlay?: string };
		GroupPage: { bookId: string; groupId?: string; overlay?: string };
		InvitePage: { code: string; overlay?: string };
	}
}

export const config = defineConfig({
	activities: [
		{ name: "HomePage", route: "/" },
		{ name: "ReadingPage", route: "/books/:bookId" },
		{ name: "NoteEditorPage", route: "/books/:bookId/write" },
		{ name: "NotePage", route: "/notes/:noteId" },
		{ name: "GroupPage", route: "/books/:bookId/groups" },
		{ name: "InvitePage", route: "/invite/:code" },
	],
	initialActivity: () => "HomePage",
	transitionDuration: 350,
});
