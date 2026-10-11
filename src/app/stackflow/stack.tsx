import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { historySyncPlugin } from "@stackflow/plugin-history-sync";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";
import { HomePage } from "@/pages/home";
import { config } from "./config";

export const { Stack } = stackflow({
	config,
	components: {
		HomePage,
	},
	plugins: [
		basicRendererPlugin(),
		basicUIPlugin({ theme: "cupertino" }),
		historySyncPlugin({
			config,
			fallbackActivity: () => "HomePage",
		}),
	],
});
