import type { ComponentProps } from "react";
import searchGradient from "./assets/tds-search-gradient.png";
import { Button } from "./button";
import { SearchIcon, XIcon } from "./tds-icon";

export function SearchField({
	label,
	value,
	onValueChange,
	...props
}: {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
} & Omit<ComponentProps<"input">, "value" | "onChange" | "type">) {
	return (
		<div>
			<div className="bg-card px-4 py-3.5">
				<label className="flex min-h-11 items-center gap-2 rounded-xl bg-search-fill py-2 pr-2 pl-2.5 focus-within:ring-2 focus-within:ring-ring/40">
					<SearchIcon className="text-muted-foreground" />
					<span className="sr-only">{label}</span>
					<input
						type="search"
						value={value}
						onChange={(event) => onValueChange(event.target.value)}
						className="min-h-7 min-w-0 flex-1 bg-transparent text-t5 leading-[1.252] font-medium outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
						{...props}
					/>
					{value && (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="검색어 지우기"
							onClick={() => onValueChange("")}
						>
							<XIcon />
						</Button>
					)}
				</label>
			</div>
			<img
				src={searchGradient}
				alt=""
				className="pointer-events-none h-4 w-full object-cover dark:hidden"
			/>
			<div
				aria-hidden="true"
				className="pointer-events-none hidden h-4 bg-linear-to-b from-card to-background dark:block"
			/>
		</div>
	);
}
