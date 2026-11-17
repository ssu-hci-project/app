import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => (
	<Sonner
		theme="light"
		className="toaster group"
		icons={{
			success: <CircleCheckIcon className="size-4 text-primary" />,
			error: <CircleAlertIcon className="size-4 text-destructive" />,
		}}
		style={
			{
				"--normal-bg": "var(--popover)",
				"--normal-text": "var(--popover-foreground)",
				"--normal-border": "var(--border)",
				"--border-radius": "var(--radius)",
			} as CSSProperties
		}
		{...props}
	/>
);

export { Toaster };
