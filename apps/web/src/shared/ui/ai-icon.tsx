import type { ComponentProps } from "react";
import { cn } from "@/shared/lib";
import { TdsIcon } from "./tds-icon";

export function AiSparkleIcon({
	className,
	...props
}: Omit<ComponentProps<typeof TdsIcon>, "name">) {
	return (
		<TdsIcon name="ai" aria-hidden="true" {...props} className={cn("text-brand", className)} />
	);
}
