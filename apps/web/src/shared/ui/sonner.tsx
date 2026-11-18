import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CircleAlertIcon, CircleCheckIcon } from "./tds-icon";

const Toaster = (props: ToasterProps) => (
	<Sonner
		theme="system"
		className="toaster group"
		icons={{
			success: <CircleCheckIcon className="size-6 text-secondary" />,
			error: <CircleAlertIcon className="size-6 text-destructive" />,
		}}
		toastOptions={{
			classNames: {
				toast:
					"gap-2.5! px-5! py-3.5! text-t6! font-semibold! backdrop-blur-xl [&_[data-icon]]:size-6!",
			},
		}}
		style={
			{
				"--normal-bg": "var(--chip-selected)",
				"--normal-text": "var(--background)",
				"--normal-border": "transparent",
				"--border-radius": "20px",
			} as CSSProperties
		}
		{...props}
	/>
);

export { Toaster };
