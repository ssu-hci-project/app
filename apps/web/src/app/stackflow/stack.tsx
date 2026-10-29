import { seedPlugin } from "@seed-design/stackflow";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";
import { GroupPage, InvitePage } from "@/pages/group";
import { HomePage } from "@/pages/home";
import { NoteEditorPage, NotePage } from "@/pages/note";
import { ReadingPage } from "@/pages/reading";
import { config } from "./config";

export const { Stack } = stackflow({
	config,
	components: {
		HomePage,
		ReadingPage,
		NotePage,
		NoteEditorPage,
		GroupPage,
		InvitePage,
	},
	plugins: [
		basicRendererPlugin(),
		seedPlugin({ theme: "cupertino" }),
		historySyncPlugin({
			config,
			fallbackActivity: () => "HomePage",
		}),
	],
});
