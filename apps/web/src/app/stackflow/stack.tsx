import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";
import { BookPage } from "@/pages/book";
import { HomePage } from "@/pages/home";
import { InvitePage } from "@/pages/invite";
import { ReaderPage } from "@/pages/reader";
import { config } from "./config";

export const { Stack } = stackflow({
	config,
	components: {
		HomePage,
		BookPage,
		ReaderPage,
		InvitePage,
	},
	plugins: [
		basicRendererPlugin(),
		historySyncPlugin({
			config,
			fallbackActivity: () => "HomePage",
		}),
	],
});
