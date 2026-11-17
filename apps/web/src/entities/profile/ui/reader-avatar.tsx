import type { Person } from "@app/contract";
import { cn } from "@/shared/lib";
import { personColor } from "../model/person";

const sizes = { xs: "size-6 text-[11px]", sm: "size-8 text-xs", md: "size-9 text-sm" } as const;

/** First letter of the name on the reader's colour. */
export function ReaderAvatar({
	person,
	name,
	size = "sm",
	className,
}: {
	person: Pick<Person, "color"> | undefined;
	name: string;
	size?: keyof typeof sizes;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-grid shrink-0 place-items-center rounded-full font-bold text-white",
				sizes[size],
				className,
			)}
			style={{ backgroundColor: personColor(person) }}
		>
			{name.slice(0, 1)}
		</span>
	);
}
