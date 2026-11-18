import { toast } from "sonner";

type Tone = "positive" | "critical" | "default";
type Action = { label: string; onClick: () => void };

export function useNotice() {
	return (message: string, tone: Tone = "default", action?: Action) => {
		const options = action ? { action, duration: 5000 } : undefined;
		if (tone === "positive") toast.success(message, options);
		else if (tone === "critical") toast.error(message, options);
		else toast(message, options);
	};
}
