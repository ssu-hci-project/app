import type { ReactNode } from "react";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "./field";
import { RadioGroup, RadioGroupItem } from "./radio-group";

/** Radio choices shown as tappable cards. */
export function ChoiceGroup({
	label,
	value,
	onValueChange,
	disabled,
	children,
}: {
	label: string;
	value: string;
	onValueChange: (value: string) => void;
	disabled?: boolean;
	children: ReactNode;
}) {
	return (
		<FieldSet>
			<FieldLegend variant="label">{label}</FieldLegend>
			<RadioGroup
				value={value}
				onValueChange={(next) => onValueChange(next as string)}
				disabled={disabled}
				className="gap-3"
			>
				{children}
			</RadioGroup>
		</FieldSet>
	);
}

export function ChoiceItem({
	value,
	label,
	description,
	icon,
}: {
	value: string;
	label: ReactNode;
	description?: ReactNode;
	icon?: ReactNode;
}) {
	return (
		<FieldLabel className="has-data-checked:border-primary has-data-checked:bg-secondary">
			<Field orientation="horizontal">
				{icon && <span className="mt-0.5 shrink-0 [&_svg]:size-5">{icon}</span>}
				<FieldContent>
					<FieldTitle className="text-st8">{label}</FieldTitle>
					{description && <FieldDescription>{description}</FieldDescription>}
				</FieldContent>
				<RadioGroupItem value={value} className="size-5" />
			</Field>
		</FieldLabel>
	);
}
