import { Checkbox } from "@base-ui/react/checkbox";
import { type ReactNode, useId } from "react";
import uncheckedIcon from "./assets/tds-checkbox-unchecked.svg";
import { FieldContent, FieldDescription, FieldLabel, FieldTitle } from "./field";
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
		<FieldLabel className="flex min-h-16 cursor-pointer items-center gap-3.5 rounded-xl border-0 px-0 py-3 font-normal">
			{leading && (
				<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
					{leading}
				</span>
			)}
			<FieldContent>
				<FieldTitle id={id} className="text-t5 leading-[1.35] font-bold">
					{title}
				</FieldTitle>
				{description && (
					<FieldDescription id={`${id}-description`} className="text-t7 leading-[1.35]">
						{description}
					</FieldDescription>
				)}
			</FieldContent>
			<Checkbox.Root
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
		</FieldLabel>
	);
}
