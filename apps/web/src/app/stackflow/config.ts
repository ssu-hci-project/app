import { defineConfig } from "@stackflow/config";

/**
 * Every screen (activity) is registered here: its name, URL, and params.
 * Adding a screen = add an entry here + a `Register` key below + a component
 * in `stack.tsx`. TypeScript then checks every `push("Name", params)` call.
 */
declare module "@stackflow/config" {
	interface Register {
		HomePage: { section?: string; tab?: string; filter?: string };
		ReadingPage: { bookId: string; page?: string; groupId?: string };
		NoteEditorPage: { bookId: string; page: string; noteId?: string; groupId?: string };
		NotePage: { noteId: string };
		GroupPage: { bookId: string; groupId?: string };
		InvitePage: { code: string };
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
