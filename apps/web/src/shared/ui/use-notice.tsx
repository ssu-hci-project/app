import { useCallback } from "react";
import { Snackbar, useSnackbarAdapter } from "./snackbar";

export function useNotice() {
	const adapter = useSnackbarAdapter();
	return useCallback(
		(message: string, variant: "positive" | "critical" | "default" = "default") => {
			adapter.create({ render: () => <Snackbar message={message} variant={variant} /> });
		},
		[adapter],
	);
}
