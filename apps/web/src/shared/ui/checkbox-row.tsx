import { Checkbox } from "@base-ui/react/checkbox";
import { type ReactNode, useId } from "react";
import uncheckedIcon from "./assets/tds-checkbox-unchecked.svg";
import { CheckIcon } from "./tds-icon";

/** TDS List Row with a controlled, keyboard-accessible Circle M checkbox. */
export function CheckboxRow({
	checked,
	onCheckedChange,
	title,
	description,
	leading,
}: {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	title: string;
	description?: string;
	leading?: ReactNode;
}) {
	const id = useId();
	return (
		<label htmlFor={`${id}-control`} className="flex w-full cursor-pointer items-center gap-4 py-3">
			{leading && (
				<span className="grid size-10 shrink-0 place-items-center rounded-full bg-search-fill text-sub">
					{leading}
				</span>
			)}
			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span id={id} className="text-t5 leading-[1.35] font-semibold text-strong">
					{title}
				</span>
				{description && (
					<span id={`${id}-description`} className="text-t7 leading-[1.35] text-sub">
						{description}
					</span>
				)}
			</span>
			<Checkbox.Root
				id={`${id}-control`}
				checked={checked}
				onCheckedChange={onCheckedChange}
				aria-labelledby={id}
				aria-describedby={description ? `${id}-description` : undefined}
				className="inline-flex size-6 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-checked:bg-primary"
			>
				{checked ? (
					<CheckIcon className="size-5 text-primary-foreground" />
				) : (
					<img src={uncheckedIcon} alt="" />
				)}
			</Checkbox.Root>
		</label>
	);
}
