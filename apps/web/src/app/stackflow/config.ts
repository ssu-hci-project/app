import { defineConfig } from "@stackflow/config";

/**
 * Every screen (activity) is registered here: its name, URL, and params.
 * Adding a screen = add an entry here + a `Register` key below + a component
 * in `stack.tsx`. TypeScript then checks every `push("Name", params)` call.
 */
declare module "@stackflow/config" {
	interface Register {
		HomePage: Record<string, never>;
	}
}

export const config = defineConfig({
	activities: [{ name: "HomePage", route: "/" }],
	initialActivity: () => "HomePage",
	transitionDuration: 350,
});
