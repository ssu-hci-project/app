import { type ComponentProps, type ReactNode, useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "./field";
import { Input } from "./input";
import { Textarea } from "./textarea";

type FieldProps = { label: ReactNode; description?: ReactNode; error?: string };

/** A labelled input with description and error message. */
export function TextField({
	label,
	description,
	error,
	...props
}: FieldProps & ComponentProps<"input">) {
	const id = useId();
	return (
		<Field data-invalid={!!error || undefined} className="gap-1.5">
			<FieldLabel htmlFor={id} className="px-1 text-t7 leading-[1.35] font-medium">
				{label}
			</FieldLabel>
			<Input
				id={id}
				aria-invalid={!!error || undefined}
				aria-describedby={error || description ? `${id}-help` : undefined}
				{...props}
			/>
			{error ? (
				<FieldError id={`${id}-help`} className="px-1 text-t7">
					{error}
				</FieldError>
			) : (
				description && (
					<FieldDescription id={`${id}-help`} className="px-1 text-t7">
						{description}
					</FieldDescription>
				)
			)}
		</Field>
	);
}

export function TextAreaField({
	label,
	description,
	error,
	...props
}: FieldProps & ComponentProps<"textarea">) {
	const id = useId();
	return (
		<Field data-invalid={!!error || undefined}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Textarea id={id} aria-invalid={!!error || undefined} {...props} />
			{error ? (
				<FieldError>{error}</FieldError>
			) : (
				description && <FieldDescription>{description}</FieldDescription>
			)}
		</Field>
	);
}
