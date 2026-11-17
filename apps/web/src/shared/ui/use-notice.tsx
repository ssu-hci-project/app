import { toast } from "sonner";

type Tone = "positive" | "critical" | "default";

/** Shows a short toast at the bottom of the mobile frame. */
export function useNotice() {
	return (message: string, tone: Tone = "default") => {
		if (tone === "positive") toast.success(message);
		else if (tone === "critical") toast.error(message);
		else toast(message);
	};
}
