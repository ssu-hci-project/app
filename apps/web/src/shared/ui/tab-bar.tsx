import { m } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { HouseIcon } from "./tds-icon";

export function HomeTabIcon() {
	return <HouseIcon />;
}

export function TabBar<T extends string>({
	value,
	options,
	onValueChange,
}: {
	value: T;
	options: { value: T; label: string; icon: ReactNode }[];
	onValueChange: (value: T) => void;
}) {
	return (
		<nav
			aria-label="하단 내비게이션"
			className="absolute inset-x-0 bottom-0 z-10 flex border-t bg-card pb-[env(safe-area-inset-bottom)]"
		>
			{options.map((option) => (
				<m.button
					whileTap={{ scale: 0.96 }}
					key={option.value}
					type="button"
					aria-current={value === option.value ? "page" : undefined}
					onClick={() => onValueChange(option.value)}
					className={cn(
						"flex h-[62px] min-w-[46px] flex-1 flex-col items-center justify-center gap-[3px] px-1.5 text-muted-foreground outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-ring active:bg-muted aria-[current=page]:text-foreground [&_svg]:size-6",
					)}
				>
					{option.icon}
					<span className="text-st11 leading-[13.2px] font-medium">{option.label}</span>
				</m.button>
			))}
		</nav>
	);
}
